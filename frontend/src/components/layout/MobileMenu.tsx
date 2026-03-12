"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import CTAButton from "@/components/ui/CTAButton";
import { easeSoft } from "@/lib/motion";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: readonly { label: string; href: string }[];
}

export default function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [...easeSoft] }}
          className="overflow-hidden border-b border-border-subtle bg-page md:hidden"
        >
          <nav className="flex flex-col items-center gap-2 px-6 pb-6 pt-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="w-full rounded-2xl py-4 text-center text-[1.05rem] font-medium text-heading transition-colors hover:bg-card-warm"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 w-full max-w-xs">
              <CTAButton href="/signin" fullWidth>
                Sign in
              </CTAButton>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
