"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import FAQItem from "@/components/ui/FAQItem";
import { fadeUp, staggerContainer, viewportConfig } from "@/lib/motion";

const faqs = [
  {
    question: "What is GeoMav?",
    answer:
      "GeoMav is an AI visibility monitoring platform that tracks how AI assistants like ChatGPT, Gemini, Claude, and Perplexity represent your business. It detects inaccurate claims, monitors your ranking, and helps you optimize your AI presence.",
  },
  {
    question: "How does AI monitoring work?",
    answer:
      "GeoMav sends realistic queries to major AI platforms on a weekly cycle — queries relevant to your business category and location. It then analyzes each response to check whether your business was mentioned, what claims were made, and which sources the AI relied on.",
  },
  {
    question: "What are AI hallucinations?",
    answer:
      "AI hallucinations are factual errors in AI-generated responses. For example, an AI might tell a customer your store closes at 6pm when you actually close at 9pm, or list services you don't offer. GeoMav automatically detects and classifies these errors.",
  },
  {
    question: "How do I improve my AI visibility?",
    answer:
      "GeoMav generates optimized content like JSON-LD structured data, /llms.txt files, and AI-readable business summaries. These help AI models understand your business accurately. After each optimization, GeoMav re-queries AI platforms to measure the improvement.",
  },
  {
    question: "Which AI platforms do you monitor?",
    answer:
      "GeoMav currently monitors ChatGPT (OpenAI), Google Gemini, Anthropic Claude, Perplexity, and Bing AI. We continuously add support for new AI assistants as they emerge.",
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
            Everything you need to know about GeoMav and how it works.
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
