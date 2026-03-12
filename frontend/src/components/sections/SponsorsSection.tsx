"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import { fadeUp, viewportConfig } from "@/lib/motion";

const sponsors = [
  { name: "ChatGPT", id: "chatgpt" },
  { name: "Google Gemini", id: "gemini" },
  { name: "Claude", id: "claude" },
  { name: "Perplexity", id: "perplexity" },
  { name: "Bing AI", id: "bingai" },
  { name: "DeepSeek", id: "deepseek" },
  { name: "Google SGE", id: "googlesge" },
];

function SponsorLogo({ name }: { name: string }) {
  return (
    <span className="whitespace-nowrap text-[0.8rem] font-medium tracking-wide text-muted/60 transition-colors duration-300 hover:text-muted">
      {name}
    </span>
  );
}

export default function SponsorsSection() {
  return (
    <section className="py-12 md:py-14 lg:py-16">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          className="flex flex-wrap items-center gap-x-8 gap-y-4 md:gap-x-10 lg:gap-x-12"
        >
          <motion.p
            variants={fadeUp}
            className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted/70"
          >
            Monitor your brand across
            <br className="md:hidden" />
            <span className="hidden md:inline"> </span>
            leading AI platforms
          </motion.p>

          {sponsors.map((sponsor) => (
            <motion.span key={sponsor.id} variants={fadeUp}>
              <SponsorLogo name={sponsor.name} />
            </motion.span>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
