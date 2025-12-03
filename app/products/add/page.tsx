"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProductSchema,
  type CreateProductInput,
} from "@/lib/productSchemas";
import { useSession } from "next-auth/react";

export default function AddProductPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      title: "",
      body_html: "",
      vendor: "",
      product_type: "",
      tags: [],
      options: [],
      images: [],
      variants: [
        {
          price: 0,
          inventory_quantity: 0,
          requires_shipping: true,
          taxable: true,
        },
      ],
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: "images",
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-300 text-sm">Checking authentication…</p>
      </div>
    );
  }

  if (!session) {
    const cb = encodeURIComponent("/products/add");
    router.replace(`/auth/login?callbackUrl=${cb}`);
    return null;
  }

  const onSubmit = async (values: CreateProductInput) => {
    setServerError(null);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Request failed: ${res.status}`);
      }

      const json = await res.json();
      const productId = json.data?.id as string | undefined;

      if (productId) {
        router.push(`/products/${productId}`);
      } else {
        router.push("/products");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unexpected error during adding of product";

      setServerError(message ?? "Something went wrong");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Add product</h1>
        <p className="text-sm text-slate-400">
          Create a new product with at least one variant and a valid price.
        </p>
      </header>

      {serverError && (
        <p className="rounded-md border border-red-500 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {serverError}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title *</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-300">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Vendor *</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              {...register("vendor")}
            />
            {errors.vendor && (
              <p className="text-xs text-red-300">{errors.vendor.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Product type</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              {...register("product_type")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Tags (comma separated)
            </label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              onChange={(e) => {
                const raw = e.target.value;
                const tags = raw
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                setValue("tags", tags);
              }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Description (HTML allowed)
          </label>
          <textarea
            rows={5}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            {...register("body_html")}
          />
          {errors.body_html && (
            <p className="text-xs text-red-300">{errors.body_html.message}</p>
          )}
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Images</h2>
            <button
              type="button"
              onClick={() => appendImage({ src: "" })}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              + Add image
            </button>
          </div>

          <div className="space-y-3">
            {imageFields.map((field, idx) => (
              <div key={field.id} className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="Image URL"
                  {...register(`images.${idx}.src`)}
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-xs text-slate-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {errors.images && (
            <p className="text-xs text-red-300">
              Invalid images: please check URLs
            </p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Variants (at least one required)
            </h2>
            <button
              type="button"
              onClick={() =>
                appendVariant({
                  price: 0,
                  inventory_quantity: 0,
                  requires_shipping: true,
                  taxable: true,
                })
              }
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              + Add variant
            </button>
          </div>

          <div className="space-y-4">
            {variantFields.map((field, idx) => (
              <div
                key={field.id}
                className="rounded-md border border-slate-800 bg-slate-950/60 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    Variant #{idx + 1}
                  </span>
                  {variantFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="text-xs text-slate-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <input
                    placeholder="Title"
                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    {...register(`variants.${idx}.title`)}
                  />
                  <input
                    placeholder="SKU"
                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    {...register(`variants.${idx}.sku`)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    {...register(`variants.${idx}.price`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                {errors.variants?.[idx]?.price && (
                  <p className="text-xs text-red-300">
                    {errors.variants[idx]?.price?.message}
                  </p>
                )}
              </div>
            ))}
          </div>

          {errors.variants && typeof errors.variants.message === "string" && (
            <p className="text-xs text-red-300">{errors.variants.message}</p>
          )}
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {isSubmitting ? "Creating…" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}
