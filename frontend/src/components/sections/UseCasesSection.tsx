"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
    id: "business",
    title: "Business",
    description:
      "Boost user engagement by offering USD bloom, a secure fiat-backed stablecoin with high yields, allowing your customers to earn effortlessly on your platform.",
    linkText: "Learn more",
    linkHref: "#business",
  },
  {
    id: "treasury",
    title: "Treasury",
    description:
      "Optimize your treasury operations with USD bloom's transparent yield generation and instant liquidity access.",
    linkText: "Learn more",
    linkHref: "#treasury",
  },
  {
    id: "developers",
    title: "Developers",
    description:
      "Integrate yield-bearing stablecoins into your dApp with simple, well-documented APIs and SDKs.",
    linkText: "Learn more",
    linkHref: "#developers",
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

        {/* 3D Building illustration placeholder */}
        <div className="relative mt-auto h-[220px] w-full md:h-[280px]">
          <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
            {/* Placeholder gradient representing the 3D building scene */}
            <div className="relative h-full w-full">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(139,124,181,0.08) 60%, rgba(139,124,181,0.15) 100%)",
                }}
              />
              {/* Stylized building silhouette placeholder */}
              <svg
                viewBox="0 0 200 180"
                className="absolute bottom-0 left-1/2 h-[160px] w-[180px] -translate-x-1/2 md:h-[200px] md:w-[220px]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Steps */}
                <rect
                  x="40"
                  y="150"
                  width="120"
                  height="8"
                  rx="2"
                  fill="#B8A9D4"
                  fillOpacity="0.3"
                />
                <rect
                  x="50"
                  y="140"
                  width="100"
                  height="8"
                  rx="2"
                  fill="#B8A9D4"
                  fillOpacity="0.35"
                />
                <rect
                  x="60"
                  y="130"
                  width="80"
                  height="8"
                  rx="2"
                  fill="#B8A9D4"
                  fillOpacity="0.4"
                />
                {/* Base */}
                <rect
                  x="55"
                  y="70"
                  width="90"
                  height="60"
                  rx="3"
                  fill="#8B7CB5"
                  fillOpacity="0.25"
                />
                {/* Columns */}
                <rect
                  x="65"
                  y="75"
                  width="8"
                  height="50"
                  rx="2"
                  fill="#8B7CB5"
                  fillOpacity="0.5"
                />
                <rect
                  x="85"
                  y="75"
                  width="8"
                  height="50"
                  rx="2"
                  fill="#8B7CB5"
                  fillOpacity="0.5"
                />
                <rect
                  x="107"
                  y="75"
                  width="8"
                  height="50"
                  rx="2"
                  fill="#8B7CB5"
                  fillOpacity="0.5"
                />
                <rect
                  x="127"
                  y="75"
                  width="8"
                  height="50"
                  rx="2"
                  fill="#8B7CB5"
                  fillOpacity="0.5"
                />
                {/* Roof triangle */}
                <path
                  d="M50 70 L100 30 L150 70 Z"
                  fill="#8B7CB5"
                  fillOpacity="0.35"
                />
                {/* Roof detail */}
                <rect
                  x="45"
                  y="65"
                  width="110"
                  height="8"
                  rx="2"
                  fill="#8B7CB5"
                  fillOpacity="0.4"
                />
              </svg>
              {/* Decorative flowers/foliage hint */}
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
              <SectionLabel>USD bloom in Action</SectionLabel>
            </motion.div>

            <motion.h2
              variants={fadeLeft}
              className="mt-4 text-[2.5rem] leading-[1.05] tracking-[-0.02em] text-heading md:text-[3rem] lg:text-[3.5rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Use cases
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[400px] text-[1rem] leading-relaxed text-body md:text-[1.05rem]"
            >
              USD bloom offers a variety of use cases for developers, businesses
              and treasuries seeking secure and profitable stablecoin
              integrations
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
