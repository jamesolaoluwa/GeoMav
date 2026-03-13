"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { EthicsFlag } from "@/lib/types";

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-red-100 text-red-800 border-red-200",
  critical: "bg-red-200 text-red-900 border-red-300",
};

const TYPE_LABELS: Record<string, string> = {
  bias: "Bias Detection",
  accuracy: "Accuracy Issue",
  sentiment_spike: "Sentiment Spike",
  disparity: "LLM Disparity",
};

const STATUS_OPTIONS = ["open", "acknowledged", "resolved", "dismissed"];

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

export default function EthicsPage() {
  const [flags, setFlags] = useState<EthicsFlag[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEthicsFlags()
      .then((res) => {
        const r = res as { flags?: EthicsFlag[]; summary?: Record<string, unknown> };
        setFlags((r.flags || []) as EthicsFlag[]);
        setSummary(r.summary || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateFlag = (id: string, status: string) => {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    api.updateEthicsFlag(id, status).catch(() => {});
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Ethics Monitor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track accuracy, bias, and fairness flags across AI platforms.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Total Flags</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.total ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Open</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{summary?.open ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Acknowledged</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{summary?.acknowledged ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{summary?.resolved ?? 0}</p>
        </div>
      </div>

      {/* Flags list */}
      {flags.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200/50">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900">No ethics flags detected</h3>
          <p className="mt-1 text-sm text-slate-500">
            GeoMav continuously monitors for bias, accuracy issues, and sentiment anomalies. Flags will appear here when detected.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {flags.map((flag) => (
            <div key={flag.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    SEVERITY_STYLES[flag.severity] || SEVERITY_STYLES.medium
                  }`}>
                    {flag.severity}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {TYPE_LABELS[flag.flag_type] || flag.flag_type}
                  </span>
                </div>
                <select
                  value={flag.status}
                  onChange={(e) => updateFlag(flag.id, e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{flag.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{flag.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                {flag.created_at ? new Date(flag.created_at).toLocaleString() : ""}
                {flag.source_agent && ` — via ${flag.source_agent} agent`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
