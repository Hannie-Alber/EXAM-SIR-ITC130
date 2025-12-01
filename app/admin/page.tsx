"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { ProductListItem } from "@/lib/shopify";

interface ProductsResponse {
  data: ProductListItem[];
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      const cb = encodeURIComponent("/admin");
      router.replace(`/auth/login?callbackUrl=${cb}`);
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const load = async () => {
      try {
        setLoadingProducts(true);
        setError(null);

        const res = await fetch("/api/products");
        if (!res.ok) {
          throw new Error(`Failed to load products (${res.status})`);
        }
        const json: ProductsResponse = await res.json();
        setProducts(json.data);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };

    void load();
  }, [status]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete product "${title}"? This cannot be undone.`)) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Failed to delete (${res.status})`);
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err?.message ?? "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-300 text-sm">Checking authentication…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin · Products</h1>
          <p className="text-sm text-slate-400">
            Manage your product catalog. Public product list & details remain
            accessible at <code>/products</code>.
          </p>
          {session?.user?.email && (
            <p className="mt-1 text-xs text-slate-500">
              Signed in as {session.user.email}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href="/products/add"
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            + Add product
          </Link>
          <Link
            href="/products"
            className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
          >
            View public catalog
          </Link>
        </div>
      </header>

      {error && (
        <p className="rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-xs text-slate-400">
          <span>
            {loadingProducts
              ? "Loading products…"
              : `${products.length} product${products.length === 1 ? "" : "s"}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80 text-slate-300">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Vendor</th>
                <th className="px-4 py-2 text-right">Min price</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Published</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingProducts ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Loading products…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No products yet. Use “Add product” to create one.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-slate-800 hover:bg-slate-900/60"
                  >
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-100">
                          {p.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {p.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-slate-300">
                      {p.vendor ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-emerald-400">
                      ${p.min_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-slate-300">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-slate-300">
                      {p.published_at
                        ? new Date(p.published_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/products/${p.id}`}
                          className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-900"
                        >
                          View
                        </Link>

                        <Link
                          href={`/products/${p.id}/edit`}
                          className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-900"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.title)}
                          disabled={deletingId === p.id}
                          className="rounded-md border border-red-500 px-2 py-1 text-[11px] text-red-200 hover:bg-red-950/50 disabled:opacity-60"
                        >
                          {deletingId === p.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
