"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/ui/FormInput";
import SocialButton from "@/components/ui/SocialButton";
import CTAButton from "@/components/ui/CTAButton";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccessMessage("Account created! Check your email to confirm, then sign in to get started.");
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
          Sign Up
        </h2>
        <p className="mt-1 text-[0.9rem] text-muted">
          Create your GeoMav account
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
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
          placeholder="Create a password"
          helperText="Use 8 or more characters with a mix of letters, numbers & symbols."
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <FormInput
          id="confirm-password"
          label="Repeat Password"
          type="password"
          placeholder="Confirm your password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {/* Terms checkbox */}
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-border-default text-card-lavender focus:ring-accent-lavender"
          />
          <span className="text-[0.85rem] text-body">
            I accept the{" "}
            <Link
              href="#terms"
              className="font-medium text-card-lavender hover:underline"
            >
              Terms
            </Link>
          </span>
        </label>

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
          {loading ? "Creating account..." : "Sign Up"}
        </CTAButton>
      </form>

      <p className="mt-6 text-center text-[0.9rem] text-body">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-card-lavender hover:underline"
        >
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
