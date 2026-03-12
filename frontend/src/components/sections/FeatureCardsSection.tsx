"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Container from "@/components/ui/Container";
import FeatureCard from "@/components/ui/FeatureCard";
import { fadeUp, staggerContainer, viewportConfig } from "@/lib/motion";

const features = [
  {
    id: "capital",
    title: "Capital that grows",
    description:
      "Earn passive income as your stablecoins are deployed into high-performing DeFi protocols.",
  },
  {
    id: "liquid",
    title: "Always liquid, always stable",
    description:
      "Stay fully dollar-pegged with instant access to your funds — no lockups or delays.",
  },
  {
    id: "handsfree",
    title: "100% hands-free",
    description:
      "No need to manage strategies manually. USD Bloom works in the background for you.",
  },
];

function FeatureImage() {
  return (
    <Image
      src="/images/feature-section.png"
      alt="3D coin nestled in lavender blooms with a purple coneflower growing beside it"
      width={1536}
      height={1024}
      className="h-full w-full object-cover object-center"
      sizes="(min-width: 768px) 50vw, 100vw"
    />
  );
}

export default function FeatureCardsSection() {
  const [activeId, setActiveId] = useState("capital");

  return (
    <section className="pb-20 md:pb-24 lg:pb-28">
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
                image={<FeatureImage />}
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
          onMouseLeave={() => setActiveId("capital")}
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
                  image={<FeatureImage />}
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
