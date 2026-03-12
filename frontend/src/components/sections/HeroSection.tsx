"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import CTAButton from "@/components/ui/CTAButton";
import { fadeUp, scaleSettle, staggerContainer } from "@/lib/motion";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[78vh] flex-col items-center overflow-hidden md:min-h-[82vh]"
    >
      {/* Centered hero text stack */}
      <motion.div
        className="relative z-10 flex flex-col items-center px-6 pt-12 text-center md:pt-14 lg:pt-16"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="mb-5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 0C10 5.523 5.523 10 0 10C5.523 10 10 14.477 10 20C10 14.477 14.477 10 20 10C14.477 10 10 5.523 10 0Z"
              fill="var(--color-heading)"
            />
          </svg>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="max-w-[640px] text-[2.5rem] leading-[1.0] tracking-[-0.02em] text-heading md:text-[3.5rem] lg:text-[4.5rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Where Money Grows
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-5 max-w-[480px] text-[0.95rem] leading-relaxed text-body md:text-[1.05rem]"
        >
          A programmable, utility-driven stable token designed for native value
          accrual and seamless integration into DeFi.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-7">
          <CTAButton href="/signup">Get started</CTAButton>
        </motion.div>
      </motion.div>

      {/* 3D hero scene with subtle parallax */}
      <motion.div
        className="relative z-0 mt-auto w-full"
        style={{ y: bgY }}
        variants={scaleSettle}
        initial="hidden"
        animate="visible"
      >
        <div className="relative w-full">
          {/* Top gradient fade into page background */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[30%]"
            style={{
              background:
                "linear-gradient(180deg, var(--color-page) 0%, transparent 100%)",
            }}
          />
          <Image
            src="/images/hero-bg1.png"
            alt="Surreal lavender floral landscape with metallic coins emerging from purple blooms"
            width={1536}
            height={1024}
            priority
            className="w-full max-h-[50vh] object-cover object-bottom md:max-h-[55vh]"
            sizes="100vw"
          />
        </div>
      </motion.div>
    </section>
  );
}
