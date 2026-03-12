"use client";

import { useState } from "react";
import { mockOpportunities } from "@/data/mock";
import type { Opportunity } from "@/lib/types";

const CATEGORY_FILTERS: { value: Opportunity["category"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "missing_mention", label: "Missing Mentions" },
  { value: "low_sentiment", label: "Low Sentiment" },
  { value: "hallucination", label: "Hallucinations" },
  { value: "content_gap", label: "Content Gaps" },
];

const CATEGORY_STYLES: Record<Opportunity["category"], string> = {
  missing_mention: "bg-orange-100 text-orange-800 border-orange-200",
  low_sentiment: "bg-red-100 text-red-800 border-red-200",
  hallucination: "bg-purple-100 text-purple-800 border-purple-200",
  content_gap: "bg-blue-100 text-blue-800 border-blue-200",
};

const CATEGORY_LABELS: Record<Opportunity["category"], string> = {
  missing_mention: "Missing Mention",
  low_sentiment: "Low Sentiment",
  hallucination: "Hallucination",
  content_gap: "Content Gap",
};

const IMPACT_STYLES: Record<Opportunity["impact"], string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const IMPACT_LABELS: Record<Opportunity["impact"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STATUS_OPTIONS: Opportunity["status"][] = ["open", "in_progress", "completed"];

const STATUS_LABELS: Record<Opportunity["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function OpportunitiesPage() {
  const [categoryFilter, setCategoryFilter] = useState<
    Opportunity["category"] | "all"
  >("all");
  const [statuses, setStatuses] = useState<Record<string, Opportunity["status"]>>(
    () =>
      Object.fromEntries(mockOpportunities.map((o) => [o.id, o.status]))
  );

  const filteredOpportunities = mockOpportunities.filter((o) => {
    if (categoryFilter === "all") return true;
    return o.category === categoryFilter;
  });

  const stats = {
    total: mockOpportunities.length,
    open: mockOpportunities.filter((o) => statuses[o.id] === "open").length,
    inProgress: mockOpportunities.filter(
      (o) => statuses[o.id] === "in_progress"
    ).length,
    completed: mockOpportunities.filter(
      (o) => statuses[o.id] === "completed"
    ).length,
  };

  const updateStatus = (id: string, status: Opportunity["status"]) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Opportunities</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Open</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.open}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {stats.inProgress}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Completed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {stats.completed}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
        {CATEGORY_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategoryFilter(value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              categoryFilter === value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Opportunities list */}
      <div className="space-y-4">
        {filteredOpportunities.map((opp) => (
          <div
            key={opp.id}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    CATEGORY_STYLES[opp.category]
                  }`}
                >
                  {CATEGORY_LABELS[opp.category]}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    IMPACT_STYLES[opp.impact]
                  }`}
                >
                  {IMPACT_LABELS[opp.impact]} impact
                </span>
              </div>
              <select
                value={statuses[opp.id]}
                onChange={(e) =>
                  updateStatus(opp.id, e.target.value as Opportunity["status"])
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{opp.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{opp.description}</p>
            <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Suggested fix
              </p>
              <p className="mt-1 text-sm text-slate-700">{opp.suggested_fix}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
