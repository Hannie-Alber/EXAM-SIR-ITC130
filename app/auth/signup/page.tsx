"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") ?? "/products";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-300 text-sm">Checking session…</p>
      </div>
    );
  }

  if (session) {
    router.replace(callbackUrl);
    return null;
  }

  const onSubmit = async (values: SignupFormValues) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = json.error ?? `Failed to sign up (${res.status})`;

        if (res.status === 409) {
          setError("email", { message: msg });
        } else {
          setError("root", { message: msg });
        }
        return;
      }

      await signIn("credentials", {
        email: values.email,
        password: values.password,
        callbackUrl,
      });
    } catch (err: any) {
      setError("root", {
        message: err?.message ?? "Unexpected error during signup",
      });
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h1 className="text-xl font-semibold text-center">Create an account</h1>
        <p className="text-sm text-slate-400 text-center">
          Sign up with your email and password.
        </p>

        {errors.root?.message && (
          <div className="rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">Name</label>
            <input
              type="text"
              {...register("name")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
            {errors.name && (
              <p className="text-[11px] text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
            {errors.email && (
              <p className="text-[11px] text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
            {errors.password && (
              <p className="text-[11px] text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Confirm password
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
            {errors.confirmPassword && (
              <p className="text-[11px] text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center">
          Already have an account?{" "}
          <Link
            href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-emerald-400 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
