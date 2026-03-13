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
    image: "/images/MonitorMain.png",
  },
  {
    id: "validate",
    title: "Validate",
    description:
      "Every factual claim an AI makes about your business is automatically compared against your verified profile. Detect hallucinations — incorrect pricing, wrong hours, fabricated services — before your customers do.",
    image: "/images/ValidateFeatureMain.png",
  },
  {
    id: "optimize",
    title: "Optimize",
    description:
      "Generate AI-optimized content — structured data, /llms.txt files, and enriched descriptions — that help AI models represent your business accurately. Track improvements over time with before-and-after comparisons.",
    image: "/images/OptimizeFeature.png",
  },
];

function FeatureImage({ feature }: { feature: (typeof features)[number] }) {
  if (!feature.image) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={feature.image}
      alt={feature.title}
      className="h-full w-full object-cover"
    />
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
                image={<FeatureImage feature={feature} />}
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
                  image={<FeatureImage feature={feature} />}
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
