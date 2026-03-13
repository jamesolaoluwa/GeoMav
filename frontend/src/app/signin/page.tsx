"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/ui/FormInput";
import SocialButton from "@/components/ui/SocialButton";
import CTAButton from "@/components/ui/CTAButton";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const onboarded = document.cookie.includes("geomav_onboarded=true");

    router.push(onboarded ? "/dashboard" : "/onboarding");
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/onboarding` : `${process.env.NEXT_PUBLIC_SITE_URL || ""}/onboarding`,
      },
    });
  };

  return (
    <AuthLayout>
      <div>
        <h2
          className="text-[1.75rem] font-semibold tracking-tight text-heading"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Sign In
        </h2>
        <p className="mt-1 text-[0.9rem] text-muted">
          Welcome back to GeoMav
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <FormInput
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border-default text-card-lavender focus:ring-accent-lavender"
            />
            <span className="text-[0.85rem] text-body">Remember me</span>
          </label>
          <Link
            href="#forgot"
            className="text-[0.85rem] font-medium text-card-lavender hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border-default" />
          <span className="text-[0.8rem] text-muted">Or with</span>
          <div className="h-px flex-1 bg-border-default" />
        </div>

        {/* Social login */}
        <SocialButton provider="google" onClick={handleGoogleSignIn} />

        {/* Submit button */}
        <CTAButton variant="lavender" fullWidth type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </CTAButton>
      </form>

      <p className="mt-6 text-center text-[0.9rem] text-body">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-card-lavender hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
