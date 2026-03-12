"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import CTAButton from "@/components/ui/CTAButton";
import { fadeUp, scaleSettle, staggerContainer } from "@/lib/motion";

const aiPlatforms = [
  { label: "ChatGPT", x: 80, y: 60 },
  { label: "Gemini", x: 320, y: 40 },
  { label: "Claude", x: 520, y: 80 },
  { label: "Perplexity", x: 160, y: 240 },
  { label: "Bing AI", x: 440, y: 260 },
];

const brandCenter = { x: 300, y: 160 };

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
              d="M10 1C6.69 1 4 3.58 4 6.75C4 11.47 10 19 10 19C10 19 16 11.47 16 6.75C16 3.58 13.31 1 10 1Z"
              fill="var(--color-heading)"
            />
            <circle cx="10" cy="6.75" r="2.25" fill="var(--color-page)" />
          </svg>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="max-w-[640px] text-[2.5rem] leading-[1.0] tracking-[-0.02em] text-heading md:text-[3.5rem] lg:text-[4.5rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Own Your AI Visibility
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

      {/* Network visualization */}
      <motion.div
        className="relative z-0 mt-auto w-full"
        style={{ y: bgY }}
        variants={scaleSettle}
        initial="hidden"
        animate="visible"
      >
        <div className="relative w-full">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[30%]"
            style={{
              background:
                "linear-gradient(180deg, var(--color-page) 0%, transparent 100%)",
            }}
          />
          <svg
            viewBox="0 0 600 320"
            className="mx-auto w-full max-w-[700px] max-h-[50vh] md:max-h-[55vh]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Connection lines from AI platforms to brand center */}
            {aiPlatforms.map((platform, i) => (
              <g key={platform.label}>
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
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: "easeOut" }}
                />
                {/* Animated data pulse along line */}
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

            {/* Brand center node */}
            <motion.circle
              cx={brandCenter.x}
              cy={brandCenter.y}
              r="28"
              fill="#8B7CB5"
              fillOpacity="0.15"
              stroke="#8B7CB5"
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            />
            <motion.circle
              cx={brandCenter.x}
              cy={brandCenter.y}
              r="12"
              fill="#8B7CB5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            />
            <text
              x={brandCenter.x}
              y={brandCenter.y + 46}
              textAnchor="middle"
              fill="#8B7CB5"
              fontSize="11"
              fontWeight="600"
            >
              Your Brand
            </text>

            {/* Radar pulse rings */}
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
              />
            ))}

            {/* AI platform nodes */}
            {aiPlatforms.map((platform, i) => (
              <g key={platform.label}>
                <motion.circle
                  cx={platform.x}
                  cy={platform.y}
                  r="20"
                  fill="#B8A9D4"
                  fillOpacity="0.12"
                  stroke="#B8A9D4"
                  strokeWidth="1.5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                />
                <motion.circle
                  cx={platform.x}
                  cy={platform.y}
                  r="6"
                  fill="#B8A9D4"
                  fillOpacity="0.6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                />
                <text
                  x={platform.x}
                  y={platform.y + 32}
                  textAnchor="middle"
                  fill="#8B7CB5"
                  fontSize="10"
                  fontWeight="500"
                  opacity="0.8"
                >
                  {platform.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </motion.div>
    </section>
  );
}
