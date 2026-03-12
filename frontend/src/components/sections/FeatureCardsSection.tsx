"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import FeatureCard from "@/components/ui/FeatureCard";
import { fadeUp, staggerContainer, viewportConfig } from "@/lib/motion";

const features = [
  {
    id: "monitor",
    title: "Monitor",
    description:
      "Track your brand across ChatGPT, Gemini, Claude, Perplexity, and Bing. See exactly when and how you're mentioned, your ranking position, and which sources AI models cite.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-6 opacity-60">
        <circle cx="40" cy="40" r="30" stroke="#B8A9D4" strokeWidth="2" />
        <circle cx="40" cy="40" r="18" stroke="#B8A9D4" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="40" cy="40" r="6" fill="#8B7CB5" />
        <line x1="40" y1="10" x2="40" y2="4" stroke="#B8A9D4" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="76" x2="40" y2="70" stroke="#B8A9D4" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="40" x2="4" y2="40" stroke="#B8A9D4" strokeWidth="2" strokeLinecap="round" />
        <line x1="76" y1="40" x2="70" y2="40" stroke="#B8A9D4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "validate",
    title: "Validate",
    description:
      "Every factual claim an AI makes about your business is automatically compared against your verified profile. Detect hallucinations — incorrect pricing, wrong hours, fabricated services — before your customers do.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-6 opacity-60">
        <rect x="12" y="18" width="56" height="44" rx="4" stroke="#B8A9D4" strokeWidth="2" />
        <path d="M28 42L36 50L54 30" stroke="#8B7CB5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="28" x2="68" y2="28" stroke="#B8A9D4" strokeWidth="1.5" />
        <circle cx="18" cy="23" r="2" fill="#B8A9D4" />
        <circle cx="24" cy="23" r="2" fill="#B8A9D4" />
        <circle cx="30" cy="23" r="2" fill="#B8A9D4" />
      </svg>
    ),
  },
  {
    id: "optimize",
    title: "Optimize",
    description:
      "Generate AI-optimized content — structured data, /llms.txt files, and enriched descriptions — that help AI models represent your business accurately. Track improvements over time with before-and-after comparisons.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-6 opacity-60">
        <polyline points="10,60 25,48 40,52 55,32 70,20" stroke="#8B7CB5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="60,20 70,20 70,30" stroke="#8B7CB5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="10" y1="68" x2="70" y2="68" stroke="#B8A9D4" strokeWidth="1.5" />
        <line x1="10" y1="14" x2="10" y2="68" stroke="#B8A9D4" strokeWidth="1.5" />
        <circle cx="25" cy="48" r="3" fill="#B8A9D4" fillOpacity="0.5" />
        <circle cx="40" cy="52" r="3" fill="#B8A9D4" fillOpacity="0.5" />
        <circle cx="55" cy="32" r="3" fill="#B8A9D4" fillOpacity="0.5" />
      </svg>
    ),
  },
];

function FeatureIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      {icon}
    </div>
  );
}

export default function FeatureCardsSection() {
  const [activeId, setActiveId] = useState("monitor");

  return (
    <section id="features" className="pb-20 md:pb-24 lg:pb-28">
      <Container>
        {/* Mobile: stacked column, first card expanded */}
        <motion.div
          className="flex flex-col gap-4 md:hidden"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {features.map((feature, idx) => (
            <motion.div key={feature.id} variants={fadeUp}>
              <FeatureCard
                title={feature.title}
                description={feature.description}
                image={<FeatureIcon icon={feature.icon} />}
                isExpanded={idx === 0}
                className="min-h-[260px]"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Desktop: flex row with expand/contract on hover */}
        <motion.div
          className="hidden md:flex md:gap-5 lg:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          onMouseLeave={() => setActiveId("monitor")}
        >
          {features.map((feature) => {
            const isExpanded = activeId === feature.id;

            return (
              <motion.div
                key={feature.id}
                variants={fadeUp}
                className="min-w-0 transition-[flex] duration-500 ease-out"
                style={{ flex: isExpanded ? 1.8 : 1 }}
              >
                <FeatureCard
                  title={feature.title}
                  description={feature.description}
                  image={<FeatureIcon icon={feature.icon} />}
                  isExpanded={isExpanded}
                  onHover={() => setActiveId(feature.id)}
                  className="h-full min-h-[340px]"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
