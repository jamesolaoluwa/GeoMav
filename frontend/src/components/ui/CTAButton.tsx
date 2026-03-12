"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { buttonTap } from "@/lib/motion";

type Variant = "primary" | "dark" | "lavender" | "outline" | "outline-green" | "explore";

interface CTAButtonProps {
  variant?: Variant;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: "default" | "sm";
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-btn-primary text-white hover:bg-btn-primary-hover",
  dark:
    "bg-btn-primary text-white hover:bg-btn-primary-hover",
  lavender:
    "bg-card-lavender text-white hover:bg-card-lavender-hover",
  outline:
    "bg-transparent border border-outline-border text-body hover:bg-card-warm hover:border-accent-lavender",
  "outline-green":
    "bg-transparent border border-accent-green text-accent-green hover:bg-accent-green-tint",
  explore:
    "bg-btn-explore text-white hover:bg-btn-explore-hover",
};

const sizeStyles: Record<"default" | "sm", string> = {
  default: "px-7 py-3 text-[0.95rem]",
  sm: "px-5 py-2.5 text-[0.85rem]",
};

export default function CTAButton({
  variant = "primary",
  children,
  href,
  onClick,
  fullWidth = false,
  size = "default",
  className = "",
}: CTAButtonProps) {
  const classes = [
    "inline-flex items-center justify-center rounded-full font-medium leading-none",
    "transition-colors duration-200 cursor-pointer select-none",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        whileTap={buttonTap}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      className={classes}
      onClick={onClick}
      whileTap={buttonTap}
    >
      {children}
    </motion.button>
  );
}
