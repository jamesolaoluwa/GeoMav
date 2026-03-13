"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import CTAButton from "@/components/ui/CTAButton";
import { fadeUp, scaleSettle, staggerContainer } from "@/lib/motion";

const VB_W = 600;
const VB_H = 320;

const aiPlatforms = [
  {
    label: "ChatGPT",
    x: 80,
    y: 60,
    image: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  },
  {
    label: "Gemini",
    x: 320,
    y: 40,
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
  },
  {
    label: "Claude",
    x: 520,
    y: 80,
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg",
  },
  {
    label: "Perplexity",
    x: 160,
    y: 240,
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg",
  },
  {
    label: "Bing AI",
    x: 440,
    y: 260,
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Bing_Fluent_Logo.svg",
  },
];

const brandCenter = { x: 300, y: 160 };

function pct(val: number, total: number) {
  return `${(val / total) * 100}%`;
}

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
      <motion.div
        className="relative z-10 flex flex-col items-center px-6 pt-12 text-center md:pt-14 lg:pt-16"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={fadeUp}
          className="max-w-[640px] text-[2.5rem] leading-[1.0] tracking-[-0.02em] text-heading md:text-[3.5rem] lg:max-w-[900px] lg:whitespace-nowrap lg:text-[4.5rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Own Your AI Visibility in
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-5 max-w-[480px] text-[0.95rem] leading-relaxed text-body md:text-[1.05rem]"
        >
          Track how ChatGPT, Gemini, Claude, and Perplexity represent your
          business. Detect hallucinations, fix inaccuracies, and improve your
          ranking in AI-powered discovery.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-7">
          <CTAButton href="/signup">Start Monitoring</CTAButton>
        </motion.div>
      </motion.div>

      <motion.div
        className="relative z-0 mt-auto w-full"
        style={{ y: bgY }}
        variants={scaleSettle}
        initial="hidden"
        animate="visible"
      >
        <div className="relative w-full overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[30%]"
            style={{
              background:
                "linear-gradient(180deg, var(--color-page) 0%, transparent 100%)",
            }}
          />

          <div className="relative mx-auto mt-4 aspect-[600/320] w-full max-w-[700px] md:mt-6">
            {/* SVG layer — connection lines, data pulses, radar rings */}
            <svg
              viewBox="0 0 600 320"
              className="absolute inset-0 h-full w-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {aiPlatforms.map((platform, i) => (
                <g key={`line-${platform.label}`}>
                  <motion.line
                    x1={platform.x}
                    y1={platform.y}
                    x2={brandCenter.x}
                    y2={brandCenter.y}
                    stroke="#B8A9D4"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{
                      duration: 1.2,
                      delay: 0.3 + i * 0.15,
                      ease: "easeOut",
                    }}
                  />
                  <motion.circle
                    r="3"
                    fill="#8B7CB5"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      cx: [platform.x, brandCenter.x],
                      cy: [platform.y, brandCenter.y],
                    }}
                    transition={{
                      duration: 2.5,
                      delay: 1 + i * 0.4,
                      repeat: Infinity,
                      repeatDelay: 2 + i * 0.3,
                      ease: "easeInOut",
                    }}
                  />
                </g>
              ))}

              {[40, 56].map((r, i) => (
                <motion.circle
                  key={r}
                  cx={brandCenter.x}
                  cy={brandCenter.y}
                  r={r}
                  fill="none"
                  stroke="#B8A9D4"
                  strokeWidth="1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.3, 0], scale: [0.8, 1.3] }}
                  transition={{
                    duration: 3,
                    delay: 1.5 + i * 1,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  style={{
                    transformOrigin: `${brandCenter.x}px ${brandCenter.y}px`,
                  }}
                />
              ))}
            </svg>

            {/* Brand center node */}
            <div
              className="absolute z-20"
              style={{
                left: pct(brandCenter.x, VB_W),
                top: pct(brandCenter.y, VB_H),
                transform: "translate(-50%, -50%)",
              }}
            >
              <motion.div
                className="flex flex-col items-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-card-lavender bg-card-lavender/15 md:h-16 md:w-16">
                  <div className="h-6 w-6 rounded-full bg-card-lavender md:h-7 md:w-7" />
                </div>
                <span className="mt-2 whitespace-nowrap text-[0.65rem] font-semibold text-card-lavender md:text-[0.7rem]">
                  Your Brand
                </span>
              </motion.div>
            </div>

            {/* AI platform nodes with logos */}
            {aiPlatforms.map((platform, i) => (
              <div
                key={platform.label}
                className="absolute z-20"
                style={{
                  left: pct(platform.x, VB_W),
                  top: pct(platform.y, VB_H),
                  transform: "translate(-50%, -50%)",
                }}
              >
                <motion.div
                  className="flex flex-col items-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4 + i * 0.1,
                    ease: "easeOut",
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-card-lavender bg-page md:h-[3.5rem] md:w-[3.5rem] shadow-[0_8px_24px_rgba(26,18,37,0.08)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={platform.image}
                      alt={platform.label}
                      className="h-6 w-6 object-contain md:h-7 md:w-7"
                    />
                  </div>
                  <span className="mt-1.5 whitespace-nowrap text-[0.65rem] font-semibold text-card-lavender md:text-[0.7rem]">
                    {platform.label}
                  </span>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
