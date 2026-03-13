"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { api } from "@/lib/api";

const STEPS = ["Enter URL", "Review Profile", "AI Scan", "Results"];

const LLM_LIST = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Bing", "DeepSeek"];

const CATEGORIES = [
  "Business", "Restaurant", "Bakery", "Plumbing", "Legal", "Dental",
  "Beauty", "Fitness", "Hospitality", "Agency", "Software", "Consulting",
  "Real Estate", "E-commerce", "Retail", "Healthcare", "Education", "Other",
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              i < current
                ? "bg-[#1a1225] text-white"
                : i === current
                ? "bg-[#8B7CB5] text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {i < current ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span className={`hidden text-sm sm:inline ${i === current ? "font-medium text-gray-900" : "text-gray-400"}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && <div className="mx-1 h-px w-6 bg-gray-300 sm:w-10" />}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);

  const [profile, setProfile] = useState({
    name: "",
    website: "",
    category: "Business",
    description: "",
    services: "",
    pricing: "",
    hours: "",
    location: "",
  });

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    setError(null);

    try {
      const res: any = await api.analyzeWebsite(url.trim());
      const p = res.profile || {};
      setProfile({
        name: p.name || "",
        website: p.website || url.trim(),
        category: p.category || "Business",
        description: p.description || "",
        services: p.services || "",
        pricing: p.pricing || "",
        hours: p.hours || "",
        location: p.location || "",
      });
      setSource(res.source || "unknown");
      setStep(1);
    } catch (e: any) {
      setError(e.message || "Failed to analyze website. Please check the URL and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      setError("Business name is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res: any = await api.saveOnboardProfile(profile);
      setBusinessId(res.business_id);
      setScanResults((prev: any) => ({
        ...prev,
        queries: res.queries || [],
        queries_count: res.queries_generated || 0,
      }));
      document.cookie = "geomav_onboarded=true; path=/; max-age=31536000";
      setStep(2);
      handleScan(res.business_id);
    } catch (e: any) {
      setError(e.message || "Failed to save profile");
      setSaving(false);
    }
  };

  const handleScan = async (bizId: string) => {
    setScanning(true);
    try {
      const res: any = await api.runOnboardScan(bizId);
      setScanResults((prev: any) => ({ ...prev, ...res }));
      const queryCount = res.queries_count || 10;
      const waitMs = Math.max(8000, queryCount * 3000);
      setTimeout(() => {
        setScanning(false);
        setScanComplete(true);
        setStep(3);
      }, waitMs);
    } catch (e: any) {
      setScanning(false);
      setScanComplete(true);
      setStep(3);
      setScanResults((prev: any) => ({ ...prev, status: "completed_with_errors" }));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo className="opacity-80 transition hover:opacity-100" />
          <StepIndicator current={step} />
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl">

          {/* Step 0: Enter URL */}
          {step === 0 && (
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 sm:p-12">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8B7CB5]/10">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B7CB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                  Let&apos;s analyze your business
                </h1>
                <p className="mx-auto mt-3 max-w-md text-gray-500">
                  Enter your website URL and we&apos;ll discover how AI assistants currently represent your business.
                </p>
              </div>

              <div className="mt-8">
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  Website URL
                </label>
                <div className="mt-2 flex gap-3">
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    placeholder="https://yourbusiness.com"
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8B7CB5] focus:outline-none focus:ring-2 focus:ring-[#8B7CB5]/30"
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || !url.trim()}
                    className="rounded-xl bg-[#1a1225] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2D2440] disabled:opacity-50"
                  >
                    {analyzing ? "Analyzing..." : "Analyze"}
                  </button>
                </div>

                {error && (
                  <p className="mt-3 text-sm text-red-600">{error}</p>
                )}

                {analyzing && (
                  <div className="mt-6 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#8B7CB5]" />
                    <p className="mt-3 text-sm text-gray-500">
                      Checking for /llms.txt, parsing meta tags...
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-6 text-center text-xs text-gray-400">
                We&apos;ll look for your /llms.txt file first, then fall back to meta tags and page content.
              </p>
            </div>
          )}

          {/* Step 1: Review Profile */}
          {step === 1 && (
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 sm:p-12">
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                  Review your business profile
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  We extracted this from your {source === "llms.txt" ? "/llms.txt file" : "website meta tags"}. Edit anything that needs fixing.
                </p>
              </div>

              {error && (
                <p className="mb-4 text-sm text-red-600">{error}</p>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name *</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#8B7CB5] focus:outline-none focus:ring-2 focus:ring-[#8B7CB5]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#8B7CB5] focus:outline-none focus:ring-2 focus:ring-[#8B7CB5]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={profile.category}
                      onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#8B7CB5] focus:outline-none focus:ring-2 focus:ring-[#8B7CB5]/30"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#8B7CB5] focus:outline-none focus:ring-2 focus:ring-[#8B7CB5]/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Services / Products</label>
                  <textarea
                    value={profile.services}
                    onChange={(e) => setProfile({ ...profile, services: e.target.value })}
                    rows={2}
                    placeholder="e.g., Website builder, E-commerce, Hosting"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8B7CB5] focus:outline-none focus:ring-2 focus:ring-[#8B7CB5]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pricing</label>
                    <input
                      value={profile.pricing}
                      onChange={(e) => setProfile({ ...profile, pricing: e.target.value })}
                      placeholder="e.g., $19/mo - $99/mo"
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8B7CB5] focus:outline-none focus:ring-2 focus:ring-[#8B7CB5]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hours</label>
                    <input
                      value={profile.hours}
                      onChange={(e) => setProfile({ ...profile, hours: e.target.value })}
                      placeholder="e.g., Mon-Fri 9am-6pm"
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8B7CB5] focus:outline-none focus:ring-2 focus:ring-[#8B7CB5]/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="e.g., Austin, TX"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8B7CB5] focus:outline-none focus:ring-2 focus:ring-[#8B7CB5]/30"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#1a1225] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2D2440] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save & Run AI Scan"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Scanning */}
          {step === 2 && (
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 sm:p-12">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                  Running your first AI scan
                </h1>
                <p className="mx-auto mt-3 max-w-md text-gray-500">
                  We&apos;re querying AI assistants to see how they represent <strong className="text-gray-900">{profile.name}</strong>.
                </p>
              </div>

              <div className="mt-10 space-y-4">
                {LLM_LIST.map((llm, i) => (
                  <div key={llm} className="flex items-center gap-4 rounded-xl bg-gray-50 px-5 py-4">
                    <div
                      className={`h-3 w-3 rounded-full transition-colors ${
                        scanning
                          ? i <= Math.floor(Date.now() / 800) % LLM_LIST.length
                            ? "bg-[#8B7CB5] animate-pulse"
                            : "bg-gray-300"
                          : "bg-green-500"
                      }`}
                    />
                    <span className="flex-1 text-sm font-medium text-gray-700">{llm}</span>
                    <span className="text-xs text-gray-400">
                      {scanning ? "Querying..." : "Done"}
                    </span>
                  </div>
                ))}
              </div>

              {scanResults?.queries && (
                <div className="mt-8 rounded-xl border border-gray-200 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Queries being sent ({scanResults.queries.length})
                  </h3>
                  <ul className="space-y-1.5">
                    {scanResults.queries.map((q: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-0.5 text-[#8B7CB5]">&bull;</span>
                        &ldquo;{q}&rdquo;
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scanning && (
                <div className="mt-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#8B7CB5]" />
                  <p className="mt-3 text-sm text-gray-500">Scanning {scanResults?.queries_count || 5} queries across {LLM_LIST.length} LLMs... this takes about 30-60 seconds.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 sm:p-12">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                  Your AI visibility scan is complete
                </h1>
                <p className="mx-auto mt-3 max-w-md text-gray-500">
                  Here&apos;s a snapshot of how AI assistants currently represent <strong className="text-gray-900">{profile.name}</strong>.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-gray-50 p-5 text-center">
                  <p className="text-3xl font-semibold text-[#1a1225]">
                    {scanResults?.queries_count || 5}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Queries Sent</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-5 text-center">
                  <p className="text-3xl font-semibold text-[#1a1225]">
                    {LLM_LIST.length}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">LLMs Scanned</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-5 text-center">
                  <p className="text-3xl font-semibold text-[#8B7CB5]">
                    Ready
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Dashboard Status</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-[#8B7CB5]/5 p-5">
                <h3 className="text-sm font-medium text-gray-900">What happens next?</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#8B7CB5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>
                    Your dashboard will show AI visibility metrics and brand rankings
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#8B7CB5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>
                    Any hallucinations (incorrect claims) will be flagged for review
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#8B7CB5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>
                    Weekly scans will track your visibility over time
                  </li>
                </ul>
              </div>

              <button
                onClick={() => router.push("/dashboard")}
                className="mt-8 w-full rounded-xl bg-[#1a1225] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#2D2440]"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
