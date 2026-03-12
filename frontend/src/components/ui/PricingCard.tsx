"use client";

import { motion, AnimatePresence } from "framer-motion";
import CTAButton from "@/components/ui/CTAButton";
import CheckItem from "@/components/ui/CheckItem";
import { cardHover, cardHoverTransition } from "@/lib/motion";

interface PricingCardProps {
  tier: string;
  audience: string;
  price: number;
  originalPrice: number;
  billingNote: string;
  features: string[];
  featured?: boolean;
  addOnLabel?: string;
  billingPeriod: "monthly" | "annual";
  className?: string;
}

export default function PricingCard({
  tier,
  audience,
  price,
  originalPrice,
  billingNote,
  features,
  featured = false,
  addOnLabel,
  billingPeriod,
  className = "",
}: PricingCardProps) {
  return (
    <motion.div
      className={`flex h-full flex-col rounded-[var(--radius-card)] bg-white p-7 shadow-soft md:p-8 ${
        featured ? "ring-1 ring-accent-lavender/30" : ""
      } ${className}`}
      whileHover={cardHover}
      transition={cardHoverTransition}
    >
      {/* Tier name */}
      <h3 className="text-[1.25rem] font-semibold text-heading">{tier}</h3>

      {/* Audience */}
      <p className="mt-1 text-[0.9rem] text-muted">{audience}</p>

      {/* Price row */}
      <div className="mt-5 flex items-baseline gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={`${billingPeriod}-${price}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="text-[2.5rem] font-semibold leading-none tracking-tight text-heading"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ${price}
          </motion.span>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.span
            key={`${billingPeriod}-${originalPrice}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="text-[1.1rem] text-strike line-through"
          >
            ${originalPrice}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Billing note */}
      <p className="mt-2 text-[0.8rem] text-muted">{billingNote}</p>

      {/* CTA button */}
      <div className="mt-6">
        <CTAButton
          variant={featured ? "lavender" : "primary"}
          fullWidth
          href="/signup"
        >
          Get Started
        </CTAButton>
      </div>

      {/* Features section */}
      <div className="mt-7 flex-1">
        <p className="mb-4 text-[0.8rem] font-medium uppercase tracking-wide text-muted">
          What&apos;s included:
        </p>
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <CheckItem key={idx}>{feature}</CheckItem>
          ))}
        </ul>
      </div>

      {/* Add-on button */}
      {addOnLabel && (
        <div className="mt-6 pt-4">
          <CTAButton variant="outline" fullWidth size="sm">
            {addOnLabel}
          </CTAButton>
        </div>
      )}
    </motion.div>
  );
}
