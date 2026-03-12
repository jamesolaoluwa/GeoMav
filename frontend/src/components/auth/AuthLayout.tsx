"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";
import { fadeUp, staggerContainer } from "@/lib/motion";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding/marketing */}
      <div
        className="hidden flex-col justify-between p-10 md:flex md:w-1/2 lg:p-14"
        style={{
          background:
            "linear-gradient(135deg, var(--color-hero) 0%, var(--color-page) 50%, rgba(184,169,212,0.15) 100%)",
        }}
      >
        <Logo variant="dark" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-[400px]"
        >
          <motion.h1
            variants={fadeUp}
            className="text-[2rem] leading-[1.15] tracking-[-0.02em] text-heading lg:text-[2.5rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Fast, Efficient and Productive
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-[1rem] leading-relaxed text-body"
          >
            Join thousands of users earning passive yield on their stablecoins
            with USD Bloom.
          </motion.p>
        </motion.div>

        {/* Spacer for bottom alignment */}
        <div />
      </div>

      {/* Right panel - form */}
      <div className="flex w-full flex-col items-center justify-center bg-white p-6 md:w-1/2 md:p-10 lg:p-14">
        {/* Mobile logo */}
        <div className="mb-8 md:hidden">
          <Logo variant="dark" />
        </div>

        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
