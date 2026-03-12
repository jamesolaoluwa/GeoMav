"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import CTAButton from "@/components/ui/CTAButton";
import { fadeLeft, fadeRight, fadeUp, staggerContainer, viewportConfig } from "@/lib/motion";

export default function ExplainerSection() {
  return (
    <section id="about" className="py-20 md:py-24 lg:py-28">
      <Container>
        <motion.div
          className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {/* Left column: heading + CTA */}
          <div>
            <motion.h2
              variants={fadeLeft}
              className="text-[2rem] leading-[1.1] tracking-[-0.015em] text-heading md:text-[2.5rem] lg:text-[3.25rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What is GeoMav?
            </motion.h2>
            <motion.div variants={fadeUp} className="mt-7">
              <CTAButton variant="explore" href="#features">
                See how it works
              </CTAButton>
            </motion.div>
          </div>

          {/* Right column: description */}
          <motion.p
            variants={fadeRight}
            className="max-w-[440px] text-[1.05rem] font-semibold leading-relaxed text-body md:text-[1.15rem] lg:text-[1.25rem]"
          >
            GeoMav is an AI visibility monitoring platform that helps businesses
            track, validate, and optimize how they appear across AI assistants.
            From detecting hallucinated claims to improving your AI ranking — we
            close the feedback loop between your business and the AI models that
            represent it.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}
