"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface ArrowLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function ArrowLink({ href, children, className = "" }: ArrowLinkProps) {
  return (
    <motion.a
      href={href}
      className={`group inline-flex items-center gap-2 text-[0.9rem] font-medium text-heading transition-colors hover:text-body ${className}`}
      whileHover="hover"
    >
      <motion.span
        className="flex h-5 w-5 items-center justify-center"
        variants={{
          hover: { x: 4 },
        }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M3 8H13M13 8L9 4M13 8L9 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
      <span>{children}</span>
    </motion.a>
  );
}
