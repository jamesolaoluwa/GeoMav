"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import {
  mockVisibilityTrend,
  mockCompetitors,
  mockTopicRankings,
  mockQueryResponses,
} from "@/data/mock";
import ExportButton from "@/components/ui/ExportButton";
import { Legend } from "recharts";
import type { TimeFilter, TopicRanking, CompetitorVisibility } from "@/lib/types";

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all_time", label: "All Time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

function StatusBadge({ status }: { status: TopicRanking["status"] }) {
  const styles: Record<TopicRanking["status"], string> = {
    needs_work: "bg-amber-100 text-amber-800 border-amber-200",
    strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
    not_ranked: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const labels: Record<TopicRanking["status"], string> = {
    needs_work: "Needs work",
    strong: "Strong",
    not_ranked: "Not ranked",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ChangeIndicator({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center text-sm font-medium ${
        isPositive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {isPositive ? (
        <svg className="mr-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="mr-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {value >= 0 ? "+" : ""}
      {value}%
    </span>
  );
}

function SentimentDot({ sentiment }: { sentiment: "positive" | "neutral" | "negative" }) {
  const colors = {
    positive: "bg-emerald-500",
    neutral: "bg-slate-400",
    negative: "bg-red-500",
  };
  const labels = {
    positive: "Positive",
    neutral: "Neutral",
    negative: "Negative",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5`}
      title={labels[sentiment]}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${colors[sentiment]}`}
        aria-hidden
      />
      <span className="text-sm capitalize text-slate-600">{labels[sentiment]}</span>
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-3 p-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-48 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

interface ComparisonData {
  period1: Record<string, number>;
  period2: Record<string, number>;
  deltas: Record<string, number>;
}

export default function VisibilityPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all_time");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [compareOpen, setCompareOpen] = useState(false);
  const [p1Start, setP1Start] = useState("");
  const [p1End, setP1End] = useState("");
  const [p2Start, setP2Start] = useState("");
  const [p2End, setP2End] = useState("");
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getVisibility(timeFilter)
      .then((res: any) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [timeFilter]);

  const handleCompare = async () => {
    if (!p1Start || !p1End || !p2Start || !p2End) return;
    setComparing(true);
    try {
      const biz = (await api.getBusiness()) as { id?: string } | null;
      const businessId = (biz as any)?.id || "";
      const res = await api.getHistoryComparison(businessId, p1Start, p1End, p2Start, p2End);
      setComparison(res as ComparisonData);
    } catch {
      setComparison(null);
    } finally {
      setComparing(false);
    }
  };

  const visibilityTrend =
    data?.visibility_history?.length > 0
      ? data.visibility_history.map((d: { date: string; score: number }) => ({
          date: d.date,
          score: d.score,
        }))
      : [];

  const brandRankings: CompetitorVisibility[] =
    data?.brand_rankings?.length > 0
      ? data.brand_rankings.map((r: any) => ({
          name: r.brand ?? r.name ?? "Unknown",
          visibility_score: r.score ?? r.visibility_score ?? 0,
          change: r.change ?? 0,
        }))
      : [];

  const topicRankings =
    data?.topic_rankings?.length > 0 &&
    data.topic_rankings.some((t: any) => Array.isArray(t.rankings))
      ? (data.topic_rankings as TopicRanking[])
      : [];

  const queryResponses: typeof mockQueryResponses = data?.query_responses?.length > 0
    ? data.query_responses.map((q: { query: string; response_rate: number }, i: number) => ({
        id: `qr-${i}`,
        query: q.query,
        llm_name: "ChatGPT" as const,
        brand_mentioned: (q.response_rate || 0) > 0.5,
        rank: null as number | null,
        sentiment: "neutral" as const,
      }))
    : [];

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Time filter bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Visibility</h1>
        <div className="flex items-center gap-3">
          <ExportButton dataType="visibility" />
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {TIME_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeFilter(value)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                timeFilter === value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Visibility Score History Chart */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Visibility Score History
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visibilityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) => [String(value), "Score"]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compare Periods */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <button
          type="button"
          onClick={() => setCompareOpen(!compareOpen)}
          className="flex w-full items-center justify-between"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Compare Periods
          </h2>
          <svg
            className={`h-5 w-5 text-slate-400 transition-transform ${compareOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {compareOpen && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-700">Period A</p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={p1Start}
                    onChange={(e) => setP1Start(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={p1End}
                    onChange={(e) => setP1End(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-700">Period B</p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={p2Start}
                    onChange={(e) => setP2Start(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={p2End}
                    onChange={(e) => setP2End(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompare}
              disabled={comparing || !p1Start || !p1End || !p2Start || !p2End}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {comparing ? "Comparing..." : "Compare"}
            </button>

            {comparison && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Visibility Score", key: "visibility_score", suffix: "" },
                    { label: "Mentions", key: "mention_count", suffix: "" },
                    { label: "Claims", key: "claim_count", suffix: "" },
                    { label: "Avg Sentiment", key: "avg_sentiment", suffix: "" },
                  ].map(({ label, key, suffix }) => {
                    const delta = comparison.deltas[key] ?? 0;
                    const isPositive = delta >= 0;
                    return (
                      <div key={key} className="rounded-lg border border-slate-200 p-3 text-center">
                        <p className="text-xs font-medium text-slate-500">{label}</p>
                        <div className="mt-1 flex items-center justify-center gap-2">
                          <span className="text-sm text-slate-600">
                            {comparison.period1[key]}{suffix}
                          </span>
                          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="text-sm font-medium text-slate-900">
                            {comparison.period2[key]}{suffix}
                          </span>
                        </div>
                        <p className={`mt-1 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                          {isPositive ? "+" : ""}{delta}{suffix}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: "Period A", ...comparison.period1 },
                        { name: "Period B", ...comparison.period2 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="visibility_score" name="Visibility" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="mention_count" name="Mentions" stroke="#10b981" strokeWidth={2} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Brand Ranking Panel */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Brand Ranking
          </h2>
        </div>
        <div className="divide-y divide-slate-200">
          {brandRankings.slice(0, 8).map((row, idx) => (
            <div
              key={row.name}
              className={`flex items-center justify-between px-5 py-3 ${
                row.name === "Your Brand"
                  ? "bg-blue-50/80 font-medium"
                  : "hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                  {idx + 1}
                </span>
                <span className="text-sm text-slate-900">{row.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">
                  {row.visibility_score}
                </span>
                <ChangeIndicator value={row.change} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility Rankings By Topic - Full Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Visibility Rankings By Topic
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Topics
                </th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <th
                    key={n}
                    className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    #{n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {topicRankings.map((row) => (
                <tr key={row.topic} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {row.topic}
                      </span>
                      <StatusBadge status={row.status} />
                    </div>
                  </td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rank) => {
                    const entry = row.rankings.find((r) => r.rank === rank);
                    const brand = entry?.brand ?? "—";
                    const isYourBrand = brand === "Your Brand";
                    return (
                      <td
                        key={rank}
                        className={`px-3 py-2 text-center ${
                          isYourBrand ? "bg-blue-50" : ""
                        }`}
                      >
                        {brand !== "—" ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isYourBrand
                                ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {brand}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Query Response Explorer */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Query Response Explorer
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Query
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  LLM
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Brand Mention
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Rank
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Sentiment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {queryResponses.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-sm text-slate-900">
                    {row.query}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-slate-700">
                    {row.llm_name}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {row.brand_mentioned ? (
                      <span className="inline-flex items-center text-emerald-600">
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-500">
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-600">
                    {row.rank ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <SentimentDot sentiment={row.sentiment} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
