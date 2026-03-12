"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import ArrowLink from "@/components/ui/ArrowLink";
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
      "A bakery in Atlanta discovers ChatGPT is telling customers they close at 6pm when they actually close at 9pm. GeoMav detects the hallucination, generates corrected structured data, and verifies the fix within a week.",
    linkText: "Learn more",
    linkHref: "#small-business",
  },
  {
    id: "ecommerce",
    title: "E-commerce",
    description:
      "Track how AI assistants recommend your products compared to competitors. Identify missing mentions and optimize your product descriptions for AI discovery.",
    linkText: "Learn more",
    linkHref: "#ecommerce",
  },
  {
    id: "agencies",
    title: "Agencies",
    description:
      "Manage AI visibility for multiple clients from a single dashboard. Generate monthly reports showing AI mention rates, accuracy improvements, and competitive positioning.",
    linkText: "Learn more",
    linkHref: "#agencies",
  },
];

function UseCaseCard({
  title,
  description,
  linkText,
  linkHref,
  isSpotlight = false,
}: {
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
  isSpotlight?: boolean;
}) {
  if (isSpotlight) {
    return (
      <div className="relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-card-warm">
        <div className="relative z-10 p-6 md:p-8">
          <h3
            className="text-[1.5rem] font-semibold leading-tight tracking-tight text-heading md:text-[1.75rem]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {title}
          </h3>
          <p className="mt-4 max-w-[340px] text-[0.9rem] leading-relaxed text-body md:text-[0.95rem]">
            {description}
          </p>
          <div className="mt-5">
            <ArrowLink href={linkHref}>{linkText}</ArrowLink>
          </div>
        </div>

        {/* Chat bubble / AI assistant illustration */}
        <div className="relative mt-auto h-[220px] w-full md:h-[280px]">
          <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
            <div className="relative h-full w-full">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(139,124,181,0.08) 60%, rgba(139,124,181,0.15) 100%)",
                }}
              />
              <svg
                viewBox="0 0 200 180"
                className="absolute bottom-0 left-1/2 h-[160px] w-[180px] -translate-x-1/2 md:h-[200px] md:w-[220px]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Chat bubble */}
                <rect
                  x="30"
                  y="40"
                  width="140"
                  height="80"
                  rx="16"
                  fill="#8B7CB5"
                  fillOpacity="0.2"
                  stroke="#8B7CB5"
                  strokeWidth="1.5"
                />
                {/* Bubble tail */}
                <path
                  d="M70 120 L60 145 L90 120"
                  fill="#8B7CB5"
                  fillOpacity="0.2"
                  stroke="#8B7CB5"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* Text lines in bubble */}
                <rect x="50" y="58" width="80" height="6" rx="3" fill="#B8A9D4" fillOpacity="0.5" />
                <rect x="50" y="72" width="100" height="6" rx="3" fill="#B8A9D4" fillOpacity="0.4" />
                <rect x="50" y="86" width="60" height="6" rx="3" fill="#B8A9D4" fillOpacity="0.3" />
                {/* AI sparkle */}
                <circle cx="155" cy="55" r="8" fill="#8B7CB5" fillOpacity="0.3" />
                <path
                  d="M155 49 L155 61 M149 55 L161 55"
                  stroke="#8B7CB5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute bottom-2 left-4 h-12 w-12 rounded-full bg-accent-lavender/20 blur-lg" />
              <div className="absolute bottom-4 right-6 h-10 w-10 rounded-full bg-accent-lavender/15 blur-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-card-light p-6 md:p-7">
      <h3
        className="text-[1.25rem] font-semibold leading-tight tracking-tight text-heading md:text-[1.35rem]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {title}
      </h3>
      <p className="mt-3 text-[0.85rem] leading-relaxed text-body md:text-[0.9rem]">
        {description}
      </p>
      <div className="mt-4">
        <ArrowLink href={linkHref}>{linkText}</ArrowLink>
      </div>
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
              linkText={spotlight.linkText}
              linkHref={spotlight.linkHref}
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
                linkText={useCase.linkText}
                linkHref={useCase.linkHref}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
