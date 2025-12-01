"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ProductListItem } from "@/lib/shopify";

interface ProductsResponse {
  data: ProductListItem[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | "all">("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/products");
        if (!res.ok) {
          throw new Error(`Failed to load products (${res.status})`);
        }

        const json: ProductsResponse = await res.json();
        setProducts(json.data ?? []);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = q ? p.title.toLowerCase().includes(q) : true;
        const matchesTag =
          tagFilter === "all" || (p.tags && p.tags.includes(tagFilter));
        return matchesSearch && matchesTag;
      }),
    [products, search, tagFilter]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-slate-400">
            Public catalog view. Use the Dashboard to manage products.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 sm:w-64"
          />

          <select
            value={tagFilter}
            onChange={(e) =>
              setTagFilter(e.target.value === "all" ? "all" : e.target.value)
            }
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 sm:w-40"
          >
            <option value="all">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <p className="rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading products…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400">
          No products match your filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const primaryImage =
              Array.isArray(p.images) && p.images.length > 0
                ? p.images[0]
                : undefined;

            return (
              <article
                key={p.id}
                className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60"
              >
                {primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={primaryImage.src}
                    alt={primaryImage.alt ?? p.title}
                    className="h-40 w-full rounded-t-xl object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-t-xl bg-slate-800 text-xs text-slate-400">
                    No image
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex-1 space-y-1">
                    <h2 className="text-sm font-semibold text-slate-100 line-clamp-2">
                      {p.title}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {p.vendor ?? "Unknown vendor"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-400">
                      ${p.min_price.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Created: {new Date(p.created_at).toLocaleDateString()}
                      {p.published_at && (
                        <>
                          {" · "}Published:{" "}
                          {new Date(p.published_at).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>

                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex justify-end">
                    <Link
                      href={`/products/${p.id}`}
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-900"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
