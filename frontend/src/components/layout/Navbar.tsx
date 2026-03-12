"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";
import CTAButton from "@/components/ui/CTAButton";
import MobileMenu from "@/components/layout/MobileMenu";
import { navLinks } from "@/data/navigation";
import { easeSmooth, fadeUp, staggerContainer } from "@/lib/motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [...easeSmooth] }}
        className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? "border-b border-border-subtle bg-page/85 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6">
          <Logo />

          <motion.nav
            className="hidden items-center gap-1 md:flex"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <motion.a
                key={link.href}
                href={link.href}
                variants={fadeUp}
                className="rounded-lg px-3.5 py-2 text-[0.9rem] font-medium text-body transition-colors duration-200 hover:text-heading"
              >
                {link.label}
              </motion.a>
            ))}
          </motion.nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <CTAButton href="/signin" size="sm">
                Sign in
              </CTAButton>
            </div>

            {/* Hamburger toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-card-warm md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <div className="flex w-5 flex-col gap-[5px]">
                <span
                  className={`h-[1.5px] w-full rounded-full bg-heading transition-transform duration-200 ${
                    menuOpen ? "translate-y-[3.25px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-[1.5px] w-full rounded-full bg-heading transition-transform duration-200 ${
                    menuOpen ? "-translate-y-[3.25px] -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu isOpen={menuOpen} onClose={closeMenu} links={navLinks} />
    </>
  );
}
