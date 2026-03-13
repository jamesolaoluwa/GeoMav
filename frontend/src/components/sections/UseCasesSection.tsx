"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import {
  fadeUp,
  fadeLeft,
  fadeRight,
  staggerContainer,
  viewportConfig,
} from "@/lib/motion";

const useCases = [
  {
    id: "small-business",
    title: "Small Business",
    description:
      "GeoMav helps small businesses understand how AI assistants represent them online. It monitors mentions across AI platforms, detects incorrect information, and helps fix it by improving the business’s online content.",
  },
  {
    id: "ecommerce",
    title: "E-commerce",
    description:
      "Track how AI assistants recommend your products compared to competitors. Identify missing mentions and optimize your product descriptions for AI discovery.",
    backgroundImage: "/images/E-Shopping2.png",
  },
  {
    id: "agencies",
    title: "Agencies",
    description:
      "Manage AI visibility for multiple clients from a single dashboard. Generate monthly reports showing AI mention rates, accuracy improvements, and competitive positioning.",
    backgroundImage: "/images/BigBusinesses.png",
  },
];

function UseCaseCard({
  title,
  description,
  isSpotlight = false,
  backgroundImage,
}: {
  title: string;
  description: string;
  isSpotlight?: boolean;
  backgroundImage?: string;
}) {
  if (isSpotlight) {
    return (
      <div className="relative min-h-[420px] overflow-hidden rounded-[var(--radius-card)] md:min-h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/SmallBusinesses.png"
          alt="Small business use case illustration"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,11,24,0.18) 0%, rgba(15,11,24,0.5) 48%, rgba(15,11,24,0.72) 100%)",
          }}
        />
        <div className="relative z-10 p-6 md:p-8">
          <h3
            className="text-[1.5rem] font-semibold leading-tight tracking-tight text-white md:text-[1.75rem]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {title}
          </h3>
          <p className="mt-4 max-w-[340px] text-[0.9rem] leading-relaxed text-white/90 md:text-[0.95rem]">
            {description}
          </p>
        </div>
      </div>
    );
  }

  if (backgroundImage) {
    return (
      <div className="relative min-h-[420px] overflow-hidden rounded-[var(--radius-card)] md:min-h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundImage}
          alt={`${title} use case illustration`}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,11,24,0.18) 0%, rgba(15,11,24,0.5) 48%, rgba(15,11,24,0.72) 100%)",
          }}
        />
        <div className="relative z-10 p-6 md:p-8">
          <h3
            className="text-[1.5rem] font-semibold leading-tight tracking-tight text-white md:text-[1.75rem]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {title}
          </h3>
          <p className="mt-4 max-w-[340px] text-[0.9rem] leading-relaxed text-white/90 md:text-[0.95rem]">
            {description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[420px] rounded-[var(--radius-card)] bg-card-light p-6 md:min-h-[520px] md:p-8">
      <h3
        className="text-[1.5rem] font-semibold leading-tight tracking-tight text-heading md:text-[1.75rem]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {title}
      </h3>
      <p className="mt-4 max-w-[340px] text-[0.9rem] leading-relaxed text-body md:text-[0.95rem]">
        {description}
      </p>
    </div>
  );
}

export default function UseCasesSection() {
  const [spotlight, ...others] = useCases;

  return (
    <section id="use-cases" className="py-20 md:py-24 lg:py-28">
      <Container>
        <motion.div
          className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {/* Left column: intro copy */}
          <div>
            <motion.div variants={fadeLeft}>
              <SectionLabel>GeoMav in Action</SectionLabel>
            </motion.div>

            <motion.h2
              variants={fadeLeft}
              className="mt-4 text-[2.5rem] leading-[1.05] tracking-[-0.02em] text-heading md:text-[3rem] lg:text-[3.5rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Use Cases
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[400px] text-[1rem] leading-relaxed text-body md:text-[1.05rem]"
            >
              GeoMav helps businesses of all sizes take control of their AI
              presence
            </motion.p>
          </div>

          {/* Right column: spotlight card */}
          <motion.div variants={fadeRight}>
            <UseCaseCard
              title={spotlight.title}
              description={spotlight.description}
              isSpotlight
            />
          </motion.div>
        </motion.div>

        {/* Additional use case cards row */}
        <motion.div
          className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:mt-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {others.map((useCase) => (
            <motion.div key={useCase.id} variants={fadeUp}>
              <UseCaseCard
                title={useCase.title}
                description={useCase.description}
                backgroundImage={useCase.backgroundImage}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
