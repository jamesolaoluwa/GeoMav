"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import BillingToggle from "@/components/ui/BillingToggle";
import PricingCard from "@/components/ui/PricingCard";
import { fadeUp, staggerContainer, viewportConfig } from "@/lib/motion";

type BillingPeriod = "monthly" | "annual";

interface PricingTier {
  name: string;
  audience: string;
  monthlyPrice: number;
  annualPrice: number;
  originalMonthly: number;
  originalAnnual: number;
  billingNote: string;
  features: string[];
  featured?: boolean;
  addOnLabel?: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Launchpad",
    audience: "Solo marketers and small merchants",
    monthlyPrice: 29,
    annualPrice: 24,
    originalMonthly: 49,
    originalAnnual: 40,
    billingNote: "per month, billed annually",
    features: [
      "Up to 3 connected wallets",
      "Basic yield strategies",
      "Email support",
      "Weekly reports",
    ],
    addOnLabel: "Add Human Coach+",
  },
  {
    name: "Momentum",
    audience: "Growing teams and mid-market businesses",
    monthlyPrice: 79,
    annualPrice: 66,
    originalMonthly: 129,
    originalAnnual: 107,
    billingNote: "per month, +$10 per additional brand",
    features: [
      "Up to 15 connected wallets",
      "Advanced yield optimization",
      "Priority support",
      "Daily reports & alerts",
      "Custom integrations",
    ],
    featured: true,
    addOnLabel: "Add Human Coach+",
  },
  {
    name: "Enterprise",
    audience: "Large organizations and treasuries",
    monthlyPrice: 199,
    annualPrice: 166,
    originalMonthly: 299,
    originalAnnual: 249,
    billingNote: "per month, custom pricing available",
    features: [
      "Unlimited connected wallets",
      "Institutional-grade strategies",
      "Dedicated account manager",
      "Real-time monitoring",
      "Custom reporting",
      "SLA guarantee",
    ],
    addOnLabel: "Add Human Coach+",
  },
];

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");

  return (
    <section id="pricing" className="bg-pricing-gradient py-20 md:py-24 lg:py-28">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="text-center"
        >
          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            className="text-[2.5rem] leading-[1.05] tracking-[-0.02em] text-heading md:text-[3rem] lg:text-[3.5rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Plans and Pricing
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-[480px] text-[1rem] leading-relaxed text-body md:text-[1.1rem]"
          >
            Choose the plan that fits your needs. All plans include core USD
            Bloom features with no hidden fees.
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex justify-center"
          >
            <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
          </motion.div>
        </motion.div>

        {/* Pricing cards */}
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
              <PricingCard
                tier={tier.name}
                audience={tier.audience}
                price={
                  billingPeriod === "monthly"
                    ? tier.monthlyPrice
                    : tier.annualPrice
                }
                originalPrice={
                  billingPeriod === "monthly"
                    ? tier.originalMonthly
                    : tier.originalAnnual
                }
                billingNote={tier.billingNote}
                features={tier.features}
                featured={tier.featured}
                addOnLabel={tier.addOnLabel}
                billingPeriod={billingPeriod}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
