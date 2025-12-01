"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const linkClass = (href: string) =>
    [
      "text-sm font-medium transition-colors",
      pathname === href
        ? "text-emerald-400"
        : "text-slate-100 hover:text-emerald-400",
    ].join(" ");

  const isAuthed = status === "authenticated";

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur z-10">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/products" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-sm font-bold">
              NS
            </span>
            <span className="text-lg font-semibold">Next Shop Catalog</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/products" className={linkClass("/products")}>
            Products
          </Link>

          {isAuthed && (
            <>
              <Link href="/admin" className={linkClass("/admin")}>
                Dashboard
              </Link>
            </>
          )}

          {isAuthed ? (
            <>
              <span className="hidden sm:inline-block text-xs text-slate-400 max-w-[160px] truncate">
                {session?.user?.name ?? session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/products" })}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-900"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-900"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
