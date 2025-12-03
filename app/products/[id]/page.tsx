"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ShopifyProduct } from "@/lib/shopify";

interface ProductResponse {
  data?: ShopifyProduct;
  error?: string;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsNotFound(false);

        const res = await fetch(`/api/products/${id}`);

        if (res.status === 404) {
          setIsNotFound(true);
          setProduct(null);
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Failed to load product (${res.status}): ${text || "Unknown error"}`
          );
        }

        const json: ProductResponse = await res.json();
        if (!json.data) {
          setIsNotFound(true);
          return;
        }

        setProduct(json.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Unexpected error during loading of product";
        setError(message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void load();
    }
  }, [id]);

  if (loading) {
    return <p className="text-slate-300">Loading product…</p>;
  }

  if (isNotFound) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <p className="text-sm text-slate-400">
          We couldn&apos;t find a product with ID <code>{id}</code>.
        </p>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
        >
          Back to products
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">No product data</h1>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
        >
          Back to products
        </button>
      </div>
    );
  }

  const firstImage = product.images?.[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <p className="text-sm text-slate-400">
            {product.vendor && <span>{product.vendor} • </span>}
            {product.product_type && <span>{product.product_type}</span>}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Created {new Date(product.created_at).toLocaleString()}
            {product.published_at && (
              <>
                {" "}
                • Published{" "}
                {new Date(product.published_at).toLocaleDateString()}
              </>
            )}
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
            {firstImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firstImage.src}
                alt={firstImage.alt ?? product.title}
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                No image
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          {product.body_html && (
            <article className="prose prose-invert max-w-none prose-sm">
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: product.body_html }} />
            </article>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Variants</h2>
            <div className="overflow-hidden rounded-lg border border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Inventory</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v) => (
                    <tr
                      key={v.id ?? v.sku}
                      className="border-t border-slate-800"
                    >
                      <td className="px-3 py-2">{v.title ?? "Untitled"}</td>
                      <td className="px-3 py-2">{v.sku ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        ${v.price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {v.inventory_quantity ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
