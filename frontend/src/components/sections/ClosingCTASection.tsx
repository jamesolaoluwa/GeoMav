"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import CTAButton from "@/components/ui/CTAButton";
import { viewportConfig } from "@/lib/motion";

export default function ClosingCTASection() {
  return (
    <section className="bg-hero py-24 md:py-28 lg:py-32">
      <Container>
        <div className="mx-auto max-w-[640px] text-center">
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportConfig}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-heading md:text-[2.75rem] lg:text-[3.25rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Take control of your AI presence
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportConfig}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-5 text-[1rem] leading-relaxed text-body md:text-[1.1rem]"
          >
            Join hundreds of businesses already monitoring and improving how AI
            represents their brand. Start with a free scan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-8"
          >
            <CTAButton variant="primary" href="/signup">
              Get Started
            </CTAButton>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
