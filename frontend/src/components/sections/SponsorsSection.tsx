"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import { fadeUp, viewportConfig } from "@/lib/motion";

const sponsors = [
  { name: "Fireblocks", id: "fireblocks" },
  { name: "KuCoin", id: "kucoin" },
  { name: "NGC", id: "ngc" },
  { name: "NxGen", id: "nxgen" },
  { name: "Matter Labs", id: "matterlabs" },
  { name: "DEXTools", id: "dextools" },
  { name: "NGRAVE", id: "ngrave" },
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
            Backed by the best companies
            <br className="md:hidden" />
            <span className="hidden md:inline"> </span>
            and visionary angels.
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
