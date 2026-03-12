"use client";

import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/ui/FormInput";
import SocialButton from "@/components/ui/SocialButton";
import CTAButton from "@/components/ui/CTAButton";

export default function SignUpPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          Create your BloomFi account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <FormInput
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="Create a password"
          helperText="Use 8 or more characters with a mix of letters, numbers & symbols."
          required
        />

        <FormInput
          id="confirm-password"
          label="Repeat Password"
          type="password"
          placeholder="Confirm your password"
          required
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
        <SocialButton provider="google" />

        {/* Submit button */}
        <CTAButton variant="lavender" fullWidth>
          Sign Up
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

      {/* Continue without account */}
      <div className="mt-6 border-t border-border-subtle pt-6">
        <Link
          href="/"
          className="group flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[0.9rem] font-medium text-muted transition-colors hover:text-body"
        >
          <span>Continue without account</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:translate-x-1"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </AuthLayout>
  );
}
