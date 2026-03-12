"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import FAQItem from "@/components/ui/FAQItem";
import { fadeUp, staggerContainer, viewportConfig } from "@/lib/motion";

const faqs = [
  {
    question: "What is USD Bloom?",
    answer:
      "USD Bloom is a yield-bearing stablecoin that helps your capital grow while staying pegged to the U.S. dollar. It combines the stability of traditional stablecoins with automated yield generation from carefully vetted DeFi protocols.",
  },
  {
    question: "How does yield generation work?",
    answer:
      "Your USD Bloom is automatically deployed into a diversified portfolio of high-performing, audited DeFi protocols. Our smart contracts continuously optimize allocations to maximize yield while maintaining strict risk parameters. You earn passive income without any manual management.",
  },
  {
    question: "Is my capital safe?",
    answer:
      "Security is our top priority. All smart contracts are audited by leading security firms. We maintain over-collateralization, implement multiple layers of risk management, and only integrate with battle-tested protocols. Your funds remain accessible and fully backed at all times.",
  },
  {
    question: "Can I withdraw at any time?",
    answer:
      "Yes, USD Bloom offers instant liquidity with no lockup periods. You can withdraw your funds at any time without penalties or delays. Your capital remains fully liquid while earning yield.",
  },
  {
    question: "What are the fees?",
    answer:
      "USD Bloom operates on a simple, transparent fee structure. There are no hidden fees, deposit fees, or withdrawal fees. We only take a small performance fee on the yield generated, meaning we only succeed when you succeed.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-24 lg:py-28">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-heading md:text-[2.75rem] lg:text-[3.25rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-[520px] text-[1rem] leading-relaxed text-body md:text-[1.05rem]"
          >
            Everything you need to know about USD Bloom and how it works.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mx-auto mt-12 max-w-[720px] space-y-4"
        >
          {faqs.map((faq, idx) => (
            <motion.div key={idx} variants={fadeUp}>
              <FAQItem
                question={faq.question}
                answer={faq.answer}
                defaultOpen={idx === 0}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
