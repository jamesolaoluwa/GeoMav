"use client";

import { motion } from "framer-motion";

type BillingPeriod = "monthly" | "annual";

interface BillingToggleProps {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
  className?: string;
}

export default function BillingToggle({
  value,
  onChange,
  className = "",
}: BillingToggleProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center rounded-full border border-border-default bg-white p-1">
        {/* Animated background indicator */}
        <motion.div
          className="absolute inset-y-1 rounded-full bg-btn-primary"
          initial={false}
          animate={{
            left: value === "monthly" ? 4 : "50%",
            right: value === "annual" ? 4 : "50%",
          }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
        />

        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`relative z-10 rounded-full px-5 py-2 text-[0.85rem] font-medium transition-colors duration-200 ${
            value === "monthly" ? "text-white" : "text-body hover:text-heading"
          }`}
        >
          Monthly
        </button>

        <button
          type="button"
          onClick={() => onChange("annual")}
          className={`relative z-10 rounded-full px-5 py-2 text-[0.85rem] font-medium transition-colors duration-200 ${
            value === "annual" ? "text-white" : "text-body hover:text-heading"
          }`}
        >
          Annual
        </button>
      </div>

      {/* Badge */}
      <span className="text-[0.75rem] font-medium text-accent-green">
        Get 2 Months Free
      </span>
    </div>
  );
}
