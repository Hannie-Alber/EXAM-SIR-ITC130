import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Next Shop Catalog</h1>
        <p className="text-slate-300">
          Go to the product catalog to get started.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          View products
        </Link>
      </div>
    </main>
  );
}
