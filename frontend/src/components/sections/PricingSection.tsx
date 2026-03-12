"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import CTAButton from "@/components/ui/CTAButton";
import CheckItem from "@/components/ui/CheckItem";
import { fadeUp, staggerContainer, viewportConfig } from "@/lib/motion";

interface PricingTier {
  name: string;
  price: number;
  period: string;
  audience: string;
  description: string;
  features: string[];
  featured?: boolean;
  cta: string;
  note?: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: 99,
    period: "/month",
    audience: "Small business owners",
    description:
      "Monitor how AI assistants represent your business, get hallucination alerts, and receive correction recommendations.",
    features: [
      "AI visibility monitoring",
      "Hallucination alerts",
      "Verified Business Profile",
      "Correction recommendations",
      "Weekly AI scan reports",
      "Email support",
    ],
    cta: "Start Monitoring",
  },
  {
    name: "Growth",
    price: 299,
    period: "/month",
    audience: "Businesses ready to optimize",
    description:
      "Full-service AI visibility optimization with automated fixes, content generation, and verified improvement tracking.",
    features: [
      "Everything in Starter",
      "Automated structured data generation",
      "FAQ content creation",
      "Direct schema deployment",
      "Bi-weekly re-query verification",
      "Before-and-after improvement reports",
    ],
    featured: true,
    cta: "Start Optimizing",
  },
  {
    name: "Agency",
    price: 999,
    period: "/month",
    audience: "Digital marketing agencies",
    description:
      "White-label AI visibility management for 10+ clients with bulk dashboards, branded reports, and API access.",
    features: [
      "Everything in Growth",
      "10+ client accounts",
      "White-label branded reports",
      "Bulk client dashboards",
      "API access",
      "Priority support",
    ],
    cta: "Contact Sales",
  },
];

function PricingCardComponent({ tier }: { tier: PricingTier }) {
  const isFeatured = tier.featured;

  return (
    <div
      className={`flex flex-col rounded-[var(--radius-card)] p-7 md:p-8 ${
        isFeatured
          ? "bg-card-dark text-on-dark shadow-lift ring-1 ring-white/10"
          : "bg-white shadow-soft ring-1 ring-border-subtle"
      }`}
    >
      <div>
        <span
          className={`text-[0.8rem] font-semibold uppercase tracking-[0.08em] ${
            isFeatured ? "text-accent-lavender" : "text-card-lavender"
          }`}
        >
          {tier.name}
        </span>
        <p
          className={`mt-1 text-[0.85rem] ${
            isFeatured ? "text-white/60" : "text-muted"
          }`}
        >
          {tier.audience}
        </p>
      </div>

      <div className="mt-5 flex items-baseline gap-1">
        <span
          className={`text-[2.75rem] font-semibold leading-none tracking-tight ${
            isFeatured ? "text-white" : "text-heading"
          }`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          ${tier.price}
        </span>
        <span
          className={`text-[0.9rem] ${
            isFeatured ? "text-white/50" : "text-muted"
          }`}
        >
          {tier.period}
        </span>
      </div>

      <p
        className={`mt-4 text-[0.9rem] leading-relaxed ${
          isFeatured ? "text-white/70" : "text-body"
        }`}
      >
        {tier.description}
      </p>

      <div className="mt-6">
        <CTAButton
          variant={isFeatured ? "lavender" : "primary"}
          fullWidth
          href="/signup"
        >
          {tier.cta}
        </CTAButton>
      </div>

      <ul className="mt-7 space-y-3 border-t border-white/10 pt-7">
        {tier.features.map((feature) => (
          <CheckItem key={feature} dark={isFeatured}>
            {feature}
          </CheckItem>
        ))}
      </ul>

      {tier.name === "Agency" && (
        <p className="mt-5 text-[0.78rem] text-muted italic">
          Enterprise plans starting at $3,000/month available in Year 2 for
          regional chains and mid-market brands.
        </p>
      )}
    </div>
  );
}

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-pricing-gradient py-20 md:py-24 lg:py-28"
    >
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-[2.5rem] leading-[1.05] tracking-[-0.02em] text-heading md:text-[3rem] lg:text-[3.5rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Plans and Pricing
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-[540px] text-[1rem] leading-relaxed text-body md:text-[1.1rem]"
          >
            From your first AI brand audit to full agency-scale optimization.
            Choose the plan that fits where you are today.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-14"
        >
          {pricingTiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              variants={fadeUp}
              className={tier.featured ? "md:order-none order-first" : ""}
              style={{
                transitionDelay: tier.featured ? "0s" : `${idx * 0.05}s`,
              }}
            >
              <PricingCardComponent tier={tier} />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
