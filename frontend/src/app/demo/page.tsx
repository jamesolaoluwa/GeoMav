"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

// ══════════════════════════════════════════════════════════════════════════════
// STORY — edit everything in this block to change the demo narrative
// ══════════════════════════════════════════════════════════════════════════════

const BUSINESS = {
  name: "Jasmine's Bakery",
  tagline: "Family-owned bakery · Austin, TX · Est. 2014",
  emoji: "🧁",
};

const BEFORE = { visibility: 24, rank: 7, rankTotal: 10, accuracy: 48, hallucinations: 6 };
const AFTER  = { visibility: 82, rank: 2,  rankTotal: 10, accuracy: 98, hallucinations: 0 };

const LLM_SCANS = [
  {
    llm: "ChatGPT",
    dot: "#10a37f",
  bad: "Jasmine's Bakery permanently closed in 2020. Location is now vacant.",
    claim: "Permanently closed in 2020",
    type: "Fabricated",
  good: "Open and operating since 2014.",
  },
  {
    llm: "Gemini",
    dot: "#4285f4",
  bad: "Bakery sold to new ownership in 2022. Quality may have changed.",
    claim: "Sold to new ownership in 2022",
    type: "Fabricated",
  good: "Still owned and run by Jasmine.",
  },
  {
    llm: "Perplexity",
    dot: "#20b2aa",
  bad: "Cash-only bakery with no online orders or pickup.",
  claim: "Cash only",
    type: "Outdated",
  good: "Accepts all major cards. Online ordering available.",
  },
  {
    llm: "Claude",
    dot: "#d97706",
  bad: "No catering options or vegan-friendly items.",
  claim: "No vegan options available",
    type: "Fabricated",
  good: "Custom cakes, catering, and vegan options available.",
  },
  {
    llm: "Bing",
    dot: "#0078d4",
  bad: "Business status unknown — may no longer be operating.",
  claim: "Status unknown",
    type: "Misleading",
  good: "Active neighborhood bakery with daily service.",
  },
  {
    llm: "DeepSeek",
    dot: "#6366f1",
  bad: "No online presence detected for Jasmine's Bakery.",
    claim: "No online presence detected",
    type: "Misleading",
  good: "Website, Google, Yelp, and Instagram active.",
  },
];

const JSON_LD_SNIPPET = `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Jasmine's Bakery",
  "openingHours": "Mo-Su 09:00-21:00",
  "acceptsReservations": false,
  "paymentAccepted": "Cash, Visa, Mastercard, Amex, Apple Pay",
  "priceRange": "$$",
  "url": "https://jasminesbakery.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "214 Cedar St",
    "addressLocality": "Austin"
  }
}`;

// ══════════════════════════════════════════════════════════════════════════════

const TOTAL_SCENES = 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ClaimBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    Fabricated: "bg-red-50/80 text-red-700 border-red-200/60 backdrop-blur-sm",
    Outdated:   "bg-amber-50/80 text-amber-800 border-amber-200/60 backdrop-blur-sm",
    Misleading: "bg-orange-50/80 text-orange-700 border-orange-200/60 backdrop-blur-sm",
  };
  return (
    <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${styles[type] ?? styles.Fabricated}`}>
      {type}
    </span>
  );
}

// ─── Scene 0: Intro ──────────────────────────────────────────────────────────

function SceneIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl border border-white/60 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-md">
        {[
          { src: "/images/logos/claude-logo.png", alt: "Claude" },
          { src: "/images/logos/gemini.png", alt: "Gemini" },
          { src: "/images/logos/perplexity-logo.png", alt: "Perplexity" },
          { src: "/images/logos/deepseek.png", alt: "DeepSeek" },
          { src: "/images/logos/copilot-logo.png", alt: "ChatGPT & others" },
        ].map((logo) => (
          <div
            key={logo.alt}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.src}
              alt={logo.alt}
              className="h-6 w-6 object-contain"
            />
          </div>
        ))}
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl">
        What does AI say<br />
        <span className="text-[#7B6B9B]">about Jasmine&apos;s bakery?</span>
      </h1>

      <p className="mx-auto mt-5 max-w-lg text-lg text-slate-600">
        See how AI platforms represent Jasmine&apos;s business across ChatGPT,
        Gemini, Claude, and more.
      </p>

      <div className="mt-10 flex items-center gap-4 rounded-2xl border border-white/60 bg-white/50 px-6 py-4 shadow-sm backdrop-blur-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B7CB5]/15 text-2xl">
          {BUSINESS.emoji}
        </div>
        <div className="text-left">
          <p className="font-semibold text-slate-800">{BUSINESS.name}</p>
          <p className="text-sm text-slate-600">{BUSINESS.tagline}</p>
        </div>
      </div>

      <button
        onClick={onStart}
        className="mt-8 rounded-xl bg-[#8B7CB5] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8B7CB5]/20 transition hover:bg-[#9d8ec8] hover:shadow-lg active:scale-95"
      >
        Check AI visibility 
      </button>
      <p className="mt-3 text-xs text-slate-500">Use controls below to navigate</p>
    </div>
  );
}

// ─── Scene 1: The Problem ────────────────────────────────────────────────────

function SceneProblem({ onStartScan }: { onStartScan: () => void }) {
  return (
    <div>
      <div className="mb-8 text-center">
        <span className="rounded-full border border-red-200/60 bg-red-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-red-600 backdrop-blur-sm">
          The Problem
        </span>
        <h2 className="mt-4 text-3xl font-bold text-slate-800">
          Here&apos;s what AI says about Jasmine&apos;s bakery.<br />
          <span className="text-red-600">Inaccurate claims detected.</span>
        </h2>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {LLM_SCANS.slice(0, 3).map((s, i) => (
          <motion.div
            key={s.llm}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="rounded-2xl border border-red-200/50 bg-red-50/40 p-4 backdrop-blur-md"
          >
            <div className="mb-3 flex items-center gap-2">
              {/* Logo behind platform name */}
              {s.llm === "ChatGPT" && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/logos/copilot-logo.png"
                    alt="ChatGPT logo"
                    className="h-4 w-4 object-contain"
                  />
                </div>
              )}
              {s.llm === "Gemini" && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/logos/gemini.png"
                    alt="Gemini logo"
                    className="h-4 w-4 object-contain"
                  />
                </div>
              )}
              {s.llm === "Perplexity" && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/logos/perplexity-logo.png"
                    alt="Perplexity logo"
                    className="h-4 w-4 object-contain"
                  />
                </div>
              )}

              <span className="text-sm font-semibold text-slate-800">{s.llm}</span>
              <span className="ml-auto text-xs text-red-600">⚠ Wrong</span>
            </div>
            <p className="text-sm leading-relaxed italic text-slate-600">&ldquo;{s.bad}&rdquo;</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="rounded-2xl border border-white/60 bg-white/50 p-5 backdrop-blur-md"
      >
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
          The reality
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "✓ Open and operating",
            "✓ Family owned bakery",
            "✓ Accepts all cards",
            "✓ Online ordering",
            "✓ Custom cakes and catering",
            "✓ Vegan options available",
          ].map((f) => (
            <span
              key={f}
              className="rounded-full border border-emerald-200/60 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-700 backdrop-blur-sm"
            >
              {f}
            </span>
          ))}
        </div>
      </motion.div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onStartScan}
          className="rounded-xl bg-[#8B7CB5] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8B7CB5]/20 transition hover:bg-[#9d8ec8] hover:shadow-lg active:scale-95"
        >
          Start AI scan →
        </button>
      </div>
    </div>
  );
}

// ─── Scene 2: Scan ───────────────────────────────────────────────────────────

function SceneScan({ scannedCount }: { scannedCount: number }) {
  return (
    <div>
      <div className="mb-8 text-center">
        <span className="rounded-full border border-[#8B7CB5]/30 bg-[#8B7CB5]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#7B6B9B] backdrop-blur-sm">
          Scanning
        </span>
  <h2 className="mt-4 text-3xl font-bold text-slate-800">GeoMav queries every AI platform.</h2>
  <p className="mt-3 text-slate-600">Extracting every claim made about Jasmine&apos;s bakery.</p>
      </div>

      <div className="space-y-2.5">
        {LLM_SCANS.map((s, i) => {
          const done = i < scannedCount;
          const active = i === scannedCount;
          return (
            <motion.div
              key={s.llm}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: done || active ? 1 : 0.4, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-start gap-4 rounded-xl border px-4 py-3.5 backdrop-blur-md transition-colors ${
                done
                  ? "border-red-200/60 bg-red-50/50"
                  : active
                  ? "border-[#8B7CB5]/40 bg-white/60"
                  : "border-white/40 bg-white/30"
              }`}
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {done ? (
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M12 9v4m0 4h.01" />
                    <path strokeLinecap="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                ) : active ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#8B7CB5]/40 border-t-[#8B7CB5]" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-slate-300" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {/* Main platform logos next to name */}
                  {s.llm === "ChatGPT" && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/logos/copilot-logo.png"
                        alt="ChatGPT logo"
                        className="h-5 w-5 object-contain"
                      />
                    </>
                  )}
                  {s.llm === "Gemini" && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/logos/gemini.png"
                        alt="Gemini logo"
                        className="h-5 w-5 object-contain"
                      />
                    </>
                  )}
                  {s.llm === "Claude" && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/logos/claude-logo.png"
                        alt="Claude logo"
                        className="h-5 w-5 object-contain"
                      />
                    </>
                  )}
                  {s.llm === "Perplexity" && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/logos/perplexity-logo.png"
                        alt="Perplexity logo"
                        className="h-5 w-5 object-contain"
                      />
                    </>
                  )}
                  {s.llm === "Bing" && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/logos/gemini.png"
                        alt="Bing logo"
                        className="h-5 w-5 object-contain opacity-70"
                      />
                    </>
                  )}
                  {s.llm === "DeepSeek" && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/logos/deepseek.png"
                        alt="DeepSeek logo"
                        className="h-5 w-5 object-contain"
                      />
                    </>
                  )}

                  <span className="text-sm font-semibold text-slate-800">{s.llm}</span>
                  {active && (
                    <span className="animate-pulse text-xs text-[#7B6B9B]">Querying…</span>
                  )}
                </div>
                {done && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-xs text-red-600"
                  >
                    ⚠ Detected:{" "}
                    <span className="font-medium">{s.claim}</span>
                  </motion.p>
                )}
              </div>
              {done && <ClaimBadge type={s.type} />}
            </motion.div>
          );
        })}
      </div>

      {scannedCount >= LLM_SCANS.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-5 rounded-xl border border-red-200/60 bg-red-50/60 p-4 text-center backdrop-blur-md"
        >
          <p className="text-2xl font-bold text-red-600">
            {LLM_SCANS.length} hallucinations detected
          </p>
          <p className="mt-1 text-sm text-slate-600">
            across all {LLM_SCANS.length} AI platforms
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Scene 3: Issues ─────────────────────────────────────────────────────────

function SceneIssues({ onGenerateCorrections }: { onGenerateCorrections: () => void }) {
  return (
    <div>
      <div className="mb-8 text-center">
        <span className="rounded-full border border-red-200/60 bg-red-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-red-600 backdrop-blur-sm">
          Issues Found
        </span>
        <h2 className="mt-4 text-3xl font-bold text-slate-800">Every AI. Every claim. Classified.</h2>
        <p className="mt-3 text-slate-600">
          GeoMav extracted and verified each incorrect claim about Jasmine&apos;s bakery against the real business details.
        </p>
      </div>

      <div className="mb-5 overflow-hidden rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md">
        <table className="min-w-full">
          <thead className="bg-white/60">
            <tr>
              {["Platform", "Claim", "Type", "Correction"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/60">
            {LLM_SCANS.map((s, i) => (
              <motion.tr
                key={s.llm}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Real platform logos instead of circular dots */}
                    {s.llm === "ChatGPT" && (
                      <div className="flex h-6 w-6 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logos/copilot-logo.png"
                          alt="ChatGPT logo"
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                    )}
                    {s.llm === "Gemini" && (
                      <div className="flex h-6 w-6 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logos/gemini.png"
                          alt="Gemini logo"
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                    )}
                    {s.llm === "Claude" && (
                      <div className="flex h-6 w-6 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logos/claude-logo.png"
                          alt="Claude logo"
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                    )}
                    {s.llm === "Perplexity" && (
                      <div className="flex h-6 w-6 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logos/perplexity-logo.png"
                          alt="Perplexity logo"
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                    )}
                    {s.llm === "Bing" && (
                      <div className="flex h-6 w-6 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logos/gemini.png"
                          alt="Bing logo"
                          className="h-5 w-5 object-contain opacity-70"
                        />
                      </div>
                    )}
                    {s.llm === "DeepSeek" && (
                      <div className="flex h-6 w-6 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logos/deepseek.png"
                          alt="DeepSeek logo"
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                    )}

                    <span className="text-sm font-medium text-slate-800">{s.llm}</span>
                  </div>
                </td>
                <td className="max-w-[180px] px-4 py-3 text-sm text-red-600">{s.claim}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <ClaimBadge type={s.type} />
                </td>
                <td className="max-w-[200px] px-4 py-3 text-sm text-emerald-700">{s.good}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-3 rounded-xl border border-[#8B7CB5]/30 bg-[#8B7CB5]/10 px-5 py-3.5 backdrop-blur-md"
      >
        <svg className="h-4 w-4 shrink-0 text-[#8B7CB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-sm text-slate-700">
          GeoMav is generating corrections for Jasmine&apos;s bakery — structured data, /llms.txt, and FAQ schemas.
        </p>
      </motion.div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onGenerateCorrections}
          className="rounded-xl bg-[#8B7CB5] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8B7CB5]/20 transition hover:bg-[#9d8ec8] hover:shadow-lg active:scale-95"
        >
          Generate corrections →
        </button>
      </div>
    </div>
  );
}

// ─── Scene 4: Fix ────────────────────────────────────────────────────────────

function SceneFix({ typedText }: { typedText: string }) {
  const progress = JSON_LD_SNIPPET.length > 0 ? typedText.length / JSON_LD_SNIPPET.length : 0;

  return (
    <div>
      <div className="mb-8 text-center">
        <span className="rounded-full border border-[#8B7CB5]/30 bg-[#8B7CB5]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#7B6B9B] backdrop-blur-sm">
          Generating
        </span>
        <h2 className="mt-4 text-3xl font-bold text-slate-800">
          GeoMav writes the truth about Jasmine&apos;s bakery in a language AI understands.
        </h2>
        <p className="mt-3 text-slate-600">
          Structured data, /llms.txt, FAQ schemas — formatted for AI readability.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "JSON-LD Schema", threshold: 0.1, desc: "Status, hours, payments" },
          { label: "/llms.txt", threshold: 0.45, desc: "AI-readable summary" },
          { label: "FAQ Schema", threshold: 0.8, desc: "Hours, ordering, catering" },
        ].map((item) => {
          const done = progress >= item.threshold;
          return (
            <div
              key={item.label}
              className={`rounded-xl border p-3.5 backdrop-blur-md transition-colors duration-500 ${
                done ? "border-emerald-200/60 bg-emerald-50/60" : "border-white/60 bg-white/40"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                {done && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto h-4 w-4 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </div>
              <p className="text-xs text-slate-600">{item.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-white/60 bg-white/50 px-4 py-2.5">
          <div className="flex gap-1.5">
            {["bg-red-400/70", "bg-amber-400/70", "bg-emerald-400/70"].map((c) => (
              <div key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />
            ))}
          </div>
          <span className="ml-2 font-mono text-xs text-slate-500">schema.json</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1 w-20 rounded-full bg-slate-200/80">
              <motion.div
                className="h-full rounded-full bg-[#8B7CB5]"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="font-mono text-xs text-slate-500">{Math.round(progress * 100)}%</span>
          </div>
        </div>
        <pre className="min-h-[220px] overflow-auto p-4 font-mono text-xs leading-relaxed text-emerald-800">
          {typedText}
          <span className="animate-pulse text-emerald-600">▋</span>
        </pre>
      </div>
    </div>
  );
}

// ─── Scene 5: Re-scan ────────────────────────────────────────────────────────

function SceneRescan({ onComplete }: { onComplete: () => void }) {
  const [greenCount, setGreenCount] = useState(0);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setGreenCount(i);
      if (i >= LLM_SCANS.length) clearInterval(t);
    }, 420);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="mb-8 text-center">
        <span className="rounded-full border border-emerald-200/60 bg-emerald-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 backdrop-blur-sm">
          Verifying
        </span>
        <h2 className="mt-4 text-3xl font-bold text-slate-800">Confirming corrections across every AI.</h2>
        <p className="mt-3 text-slate-600">
          GeoMav re-queries all platforms to verify your corrections took effect.
        </p>
      </div>

      <div className="space-y-2.5">
        {LLM_SCANS.map((s, i) => {
          const done = i < greenCount;
          return (
            <motion.div
              key={s.llm}
              className={`flex items-center gap-4 rounded-xl border px-4 py-3.5 backdrop-blur-md transition-all duration-500 ${
                done ? "border-emerald-200/60 bg-emerald-50/50" : "border-white/40 bg-white/30 opacity-50"
              }`}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {done ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500"
                  >
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                ) : (
                  <div className="h-2 w-2 rounded-full bg-slate-300" />
                )}
              </div>

              <div className="flex w-24 shrink-0 items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: s.dot }} />
                <span className="text-sm font-semibold text-slate-800">{s.llm}</span>
              </div>

              {done && (
                <motion.p
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 text-right text-xs text-emerald-700"
                >
                  {s.good}
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </div>

      {greenCount >= LLM_SCANS.length && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={onComplete}
            className="rounded-xl bg-[#8B7CB5] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8B7CB5]/20 transition hover:bg-[#9d8ec8] hover:shadow-lg active:scale-95"
          >
            View results →
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Scene 6: After ──────────────────────────────────────────────────────────

function SceneAfter({
  vis,
  rank,
  hall,
  onContinue,
}: {
  vis: number;
  rank: number;
  hall: number;
  onContinue: () => void;
}) {
  return (
    <div>
      <div className="mb-8 text-center">
        <span className="rounded-full border border-emerald-200/60 bg-emerald-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-800 backdrop-blur-sm">
          After GeoMav
        </span>
        <h2 className="mt-4 text-3xl font-bold text-slate-900">
          Jasmine&apos;s bakery is now seen clearly.<br />
          <span className="text-emerald-700">Everywhere that matters.</span>
        </h2>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "AI Visibility",   before: BEFORE.visibility,     after: AFTER.visibility,     current: vis,  prefix: ""  },
          { label: "Brand Ranking",   before: BEFORE.rank,           after: AFTER.rank,           current: rank, prefix: "#" },
          { label: "Hallucinations",  before: BEFORE.hallucinations, after: AFTER.hallucinations, current: hall, prefix: ""  },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 text-center backdrop-blur-md"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600">{m.label}</p>
            <p className="mt-2 tabular-nums text-4xl font-bold text-slate-900">
              {m.prefix}{m.current}
            </p>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs">
              <span className="line-through text-slate-500">{m.prefix}{m.before}</span>
              <span className="text-emerald-700">→ {m.prefix}{m.after}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {LLM_SCANS.slice(0, 3).map((s, i) => (
          <motion.div
            key={s.llm}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 + 0.3 }}
            className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 backdrop-blur-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.dot }} />
              <span className="text-sm font-semibold text-slate-900">{s.llm}</span>
              <span className="ml-auto text-xs font-medium text-emerald-700">✓ Accurate</span>
            </div>
            <p className="text-sm leading-relaxed italic text-slate-700">&ldquo;{s.good}&rdquo;</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onContinue}
          className="rounded-xl bg-[#8B7CB5] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8B7CB5]/20 transition hover:bg-[#9d8ec8] hover:shadow-lg active:scale-95"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─── Scene 7: Report ready ───────────────────────────────────────────────────

function SceneReportReady() {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-200/60 bg-emerald-50/60 shadow-sm backdrop-blur-md"
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </motion.div>

      <h2 className="text-4xl font-bold text-slate-800">
        Jasmine&apos;s AI visibility report is ready.<br />
        <span className="text-[#7B6B9B]">Corrections applied and verified.</span>
      </h2>

      <p className="mx-auto mt-5 max-w-md text-lg text-slate-600">
        AI platforms now shows more accurate information about Jasmine&apos;s bakery.
        Customers searching with AI assistants can now find this business easier.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/signup"
          className="rounded-xl bg-[#8B7CB5] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8B7CB5]/25 transition hover:bg-[#9d8ec8] hover:shadow-lg active:scale-95"
        >
          Go to dashboard →
        </Link>
        <Link href="/" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
          Back to home
        </Link>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Demo complete · Sign up to monitor your own business
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [scene, setScene] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [afterVis,  setAfterVis]  = useState(BEFORE.visibility);
  const [afterRank, setAfterRank] = useState(BEFORE.rank);
  const [afterHall, setAfterHall] = useState(BEFORE.hallucinations);

  const goTo = useCallback(
    (n: number) => setScene(Math.max(0, Math.min(n, TOTAL_SCENES - 1))),
    [],
  );
  const prev = useCallback(() => goTo(scene - 1), [scene, goTo]);
  const next = useCallback(() => goTo(scene + 1), [scene, goTo]);

  // Scene 2: sequential scan animation (no auto-advance)
  useEffect(() => {
    if (scene !== 2) { setScannedCount(0); return; }
    let count = 0;
    const t = setInterval(() => {
      count++;
      setScannedCount(count);
      if (count >= LLM_SCANS.length) {
        clearInterval(t);
      }
    }, 650);
    return () => clearInterval(t);
  }, [scene]);

  // Scene 4: typewriter (no auto-advance)
  useEffect(() => {
    if (scene !== 4) { setTypedText(""); return; }
    let i = 0;
    const t = setInterval(() => {
      setTypedText(JSON_LD_SNIPPET.slice(0, ++i));
      if (i >= JSON_LD_SNIPPET.length) {
        clearInterval(t);
      }
    }, 16);
    return () => {
      clearInterval(t);
    };
  }, [scene]);

  // Scene 6: animated counters
  useEffect(() => {
    if (scene !== 6) {
      setAfterVis(BEFORE.visibility);
      setAfterRank(BEFORE.rank);
      setAfterHall(BEFORE.hallucinations);
      return;
    }
    const steps = 60;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setAfterVis(Math.round(BEFORE.visibility + (AFTER.visibility - BEFORE.visibility) * ease));
      setAfterRank(Math.round(BEFORE.rank      - (BEFORE.rank - AFTER.rank)             * ease));
      setAfterHall(Math.round(BEFORE.hallucinations * (1 - ease)));
      if (step >= steps) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [scene]);

  return (
    <div className="demo-glass-page relative min-h-screen">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(165deg, #f8f6fc 0%, #f2eef8 35%, #ebe4f4 70%, #e5e0f0 100%)",
        }}
      />
      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-white/60 backdrop-blur-sm">
        <motion.div
          className="h-full bg-[#8B7CB5]"
          animate={{ width: `${((scene + 1) / TOTAL_SCENES) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Demo mode badge */}
      <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
        <div className="demo-glass-pill flex items-center gap-2 rounded-full border border-white/70 bg-white/40 px-4 py-1.5 shadow-sm backdrop-blur-xl">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8B7CB5]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
            Demo Mode
          </span>
        </div>
      </div>

      {/* GeoMav home link */}
      <div className="fixed left-6 top-[18px] z-50">
        <Logo
          className="opacity-70 transition hover:opacity-100 [&_img]:h-7 [&_img]:w-auto md:[&_img]:h-8"
        />
      </div>

      {/* Scene content */}
      <main className="flex min-h-screen items-center justify-center px-4 py-28">
        <div className="demo-glass-panel w-full max-w-4xl rounded-[28px] border border-white/70 bg-white/35 p-6 shadow-[0_8px_40px_rgba(139,124,181,0.12)] backdrop-blur-xl md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              {scene === 0 && <SceneIntro onStart={next} />}
              {scene === 1 && <SceneProblem onStartScan={next} />}
              {scene === 2 && <SceneScan scannedCount={scannedCount} />}
              {scene === 3 && <SceneIssues onGenerateCorrections={next} />}
              {scene === 4 && <SceneFix typedText={typedText} />}
              {scene === 5 && <SceneRescan onComplete={() => setScene(6)} />}
              {scene === 6 && <SceneAfter vis={afterVis} rank={afterRank} hall={afterHall} onContinue={next} />}
              {scene === 7 && <SceneReportReady />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom nav controls */}
      <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
        <div className="demo-glass-pill flex items-center gap-5 rounded-2xl border border-white/70 bg-white/40 px-6 py-3 shadow-[0_8px_32px_rgba(139,124,181,0.08)] backdrop-blur-xl">
          <button
            onClick={prev}
            disabled={scene === 0}
            className="text-sm text-slate-600 transition hover:text-slate-900 disabled:opacity-30"
          >
            ← Prev
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === scene
                    ? "h-1.5 w-5 bg-[#8B7CB5]"
                    : "h-1.5 w-1.5 bg-slate-300/60 hover:bg-slate-400/60"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            disabled={scene === TOTAL_SCENES - 1}
            className="text-sm text-slate-600 transition hover:text-slate-900 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
