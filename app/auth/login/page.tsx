"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import type { SignInResponse } from "next-auth/react";

type LoginFormValues = {
  email: string;
  password: string;
};

function mapErrorToMessage(error: string | null): string | null {
  if (!error) return null;

  switch (error) {
    case "Configuration":
      return "There is a server configuration problem. Double-check NEXTAUTH_URL, NEXTAUTH_SECRET, and your OAuth credentials.";
    case "OAuthSignin":
      return "There was a problem redirecting to the provider. Check your provider settings and redirect URI.";
    case "OAuthCallback":
      return "There was a problem handling the response from the provider. Check the redirect URI and that you’re using an allowed account.";
    case "CredentialsSignin":
      return "Invalid email or password.";
    default:
      return `Something went wrong during sign in (code: ${error}). Check the terminal logs for more details.`;
  }
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") ?? "/products";

  const errorCode = searchParams.get("error");
  const errorMessage = useMemo(() => mapErrorToMessage(errorCode), [errorCode]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
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

  const onEmailLogin = async (values: LoginFormValues): Promise<void> => {
    try {
      const result: SignInResponse | undefined = await signIn("credentials", {
        email: values.email,
        password: values.password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("password", {
          message: "Invalid email or password.",
        });
        return;
      }

      if (result?.url) {
        router.push(result.url);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error during login";

      setError("password", {
        message,
      });
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  const handleFacebookSignIn = () => {
    signIn("facebook", { callbackUrl });
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h1 className="text-xl font-semibold text-center">Sign in</h1>
        <p className="text-sm text-slate-400 text-center">
          Sign in with email/password or continue with Google / Facebook.
        </p>

        {errorMessage && (
          <div className="rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onEmailLogin)} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in with email"}
          </button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-slate-900/50 px-2 text-slate-500">
              or continue with
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 flex items-center justify-center gap-2"
          >
            <span>🔵</span>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={handleFacebookSignIn}
            className="w-full rounded-md bg-[#1877F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#1458b8] flex items-center justify-center gap-2"
          >
            <span>📘</span>
            <span>Facebook</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Don&apos;t have an account?{" "}
          <Link
            href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-emerald-400 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
