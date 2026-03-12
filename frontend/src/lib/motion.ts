import type { Variants } from "framer-motion";

export const easeSmooth = [0.25, 0.1, 0.25, 1.0] as const;
export const easeSoft = [0.4, 0.0, 0.2, 1.0] as const;
export const easeQuick = [0.2, 0.0, 0.0, 1.0] as const;

export const viewportConfig = { once: true, amount: 0.25 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [...easeSmooth] },
  },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [...easeSmooth] },
  },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [...easeSmooth] },
  },
};

export const scaleSettle: Variants = {
  hidden: { opacity: 0, scale: 1.05 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.0, ease: [...easeSoft] },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const cardHover = {
  y: -4,
  boxShadow: "0 4px 24px rgba(26,18,37,0.08)",
};

export const cardHoverTransition = {
  duration: 0.25,
  ease: [0.2, 0, 0, 1] as [number, number, number, number],
};

export const buttonTap = { scale: 0.98 };
