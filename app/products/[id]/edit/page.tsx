"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ShopifyProduct,
  ShopifyImage,
  ShopifyVariant,
} from "@/lib/shopify";

const imageSchema = z.object({
  id: z.string().optional(),
  src: z.string().min(1, "Image URL is required"),
  alt: z.string().optional(),
});

const variantSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  vendor: z.string().min(1, "Vendor is required"),
  product_type: z.string().optional(),
  tags: z.string().optional(),
  images: z.array(imageSchema),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductResponse {
  data: ShopifyProduct & {
    created_at?: string;
    published_at?: string | null;
    images?: ShopifyImage[];
    variants?: ShopifyVariant[];
  };
}

export default function EditProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? "";

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      vendor: "",
      product_type: "",
      tags: "",
      images: [],
      variants: [],
    },
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: "images",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  useEffect(() => {
    if (!id) return;
    if (status === "unauthenticated") {
      const cb = encodeURIComponent(`/products/${id}/edit`);
      router.replace(`/auth/login?callbackUrl=${cb}`);
    }
  }, [status, id, router]);

  useEffect(() => {
    if (status !== "authenticated" || !id) return;

    const load = async (): Promise<void> => {
      try {
        setLoadingProduct(true);
        setLoadError(null);

        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to load product (${res.status})`);
        }

        const json: ProductResponse = await res.json();
        const p = json.data;

        const images = (p.images ?? []).map((img) => ({
          id: img.id,
          src: img.src,
          alt: img.alt ?? "",
        }));

        const variants = (p.variants ?? []).map((v) => ({
          id: v.id,
          title: v.title ?? "",
          sku: v.sku ?? "",
          price: v.price,
        }));

        reset({
          title: p.title ?? "",
          description: p.body_html ?? "",
          vendor: p.vendor ?? "",
          product_type: p.product_type ?? "",
          tags: p.tags?.join(", ") ?? "",
          images: images.length ? images : [{ src: "", alt: "" }],
          variants: variants.length
            ? variants
            : [{ title: "", sku: "", price: 0 }],
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unexpected error edit";

        setLoadError(message);
      } finally {
        setLoadingProduct(false);
      }
    };

    void load();
  }, [status, id, reset]);

  const onSubmit = async (values: FormValues): Promise<void> => {
    if (!id) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const imagesPayload: ShopifyImage[] = values.images.map((img) => ({
        id: img.id,
        src: img.src,
        alt: img.alt || undefined,
      }));

      const variantsPayload: ShopifyVariant[] = values.variants.map((v) => ({
        id: v.id,
        title: v.title || undefined,
        sku: v.sku || undefined,
        price: v.price,
      }));

      const payload = {
        title: values.title,
        body_html: values.description,
        vendor: values.vendor,
        product_type: values.product_type?.trim() || undefined,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        images: imagesPayload,
        variants: variantsPayload,
      };

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(
          json.error ?? `Failed to update product (${res.status})`
        );
      }

      router.push(`/products/${id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error edit";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loadingProduct) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-300 text-sm">
          {status === "loading"
            ? "Checking authentication…"
            : "Loading product…"}
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Edit product</h1>
        <p className="text-sm text-red-300">{loadError}</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-600">Edit product</h1>
        <p className="text-sm text-slate-400">
          Same fields as &quot;Add product&quot;, including images and variants.
        </p>
      </header>

      {submitError && (
        <p className="rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
          {submitError}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border border-slate-300 bg-slate-700/50 p-4"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Title<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
            {errors.title && (
              <p className="text-[11px] text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Description<span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              {...register("description")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
            {errors.description && (
              <p className="text-[11px] text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Vendor<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("vendor")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
            {errors.vendor && (
              <p className="text-[11px] text-red-400">
                {errors.vendor.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Product type
              </label>
              <input
                type="text"
                {...register("product_type")}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Tags (comma separated)
              </label>
              <input
                type="text"
                {...register("tags")}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Images</h2>
            <button
              type="button"
              onClick={() => appendImage({ src: "", alt: "" })}
              className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-900"
            >
              + Add image
            </button>
          </div>

          <div className="space-y-3">
            {imageFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-2 rounded-md border border-slate-800 bg-slate-950/40 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-200">
                      Image URL
                    </label>
                    <input
                      type="text"
                      {...register(`images.${index}.src` as const)}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                    />
                    {errors.images?.[index]?.src && (
                      <p className="text-[10px] text-red-400">
                        {errors.images[index]?.src?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-200">
                      Alt text
                    </label>
                    <input
                      type="text"
                      {...register(`images.${index}.alt` as const)}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                    />
                  </div>
                </div>

                <div className="flex items-start justify-end">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="rounded-md border border-red-500 px-2 py-1 text-[11px] text-red-200 hover:bg-red-950/50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {imageFields.length === 0 && (
              <p className="text-xs text-slate-500">
                No images. Use &quot;Add image&quot; to add one.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Variants</h2>
            <button
              type="button"
              onClick={() =>
                appendVariant({
                  title: "",
                  sku: "",
                  price: 0,
                })
              }
              className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-900"
            >
              + Add variant
            </button>
          </div>

          <div className="space-y-3">
            {variantFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-2 rounded-md border border-slate-800 bg-slate-950/40 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-200">
                        Title
                      </label>
                      <input
                        type="text"
                        {...register(`variants.${index}.title` as const)}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-200">
                        SKU
                      </label>
                      <input
                        type="text"
                        {...register(`variants.${index}.sku` as const)}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-200">
                      Price<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.price` as const, {
                        valueAsNumber: true,
                      })}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                    />
                    {errors.variants?.[index]?.price && (
                      <p className="text-[10px] text-red-400">
                        {errors.variants[index]?.price?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-end">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="rounded-md border border-red-500 px-2 py-1 text-[11px] text-red-200 hover:bg-red-950/50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {errors.variants && !Array.isArray(errors.variants) && (
              <p className="text-[11px] text-red-400">
                {String(errors.variants.message)}
              </p>
            )}

            {variantFields.length === 0 && (
              <p className="text-xs text-slate-500">
                No variants. Use &quot;Add variant&quot; to add one.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-md border border-slate-700 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
