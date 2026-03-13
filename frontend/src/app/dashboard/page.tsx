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
import { useUserId } from "@/lib/UserContext";
import {
  mockDashboardMetrics,
  mockVisibilityTrend,
  mockLLMBreakdown,
  mockCompetitors,
  mockHallucinations,
} from "@/data/mock";
import ExportButton from "@/components/ui/ExportButton";
import type { TimeFilter, ClaimStatus, LLMBreakdown, CompetitorVisibility } from "@/lib/types";

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all_time", label: "All Time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

function StatusBadge({ status }: { status: ClaimStatus }) {
  const styles: Record<ClaimStatus, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    correction_deployed: "bg-blue-100 text-blue-800 border-blue-200",
    resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  const labels: Record<ClaimStatus, string> = {
    pending: "Pending",
    correction_deployed: "Correction Deployed",
    resolved: "Resolved",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ChangeIndicator({
  value,
  suffix = "%",
}: {
  value: number;
  suffix?: string;
}) {
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
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-3 p-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all_time");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const [estimated, setEstimated] = useState(false);
  const userId = useUserId();

  useEffect(() => {
    setLoading(true);
    setEstimated(false);
    api
      .getDashboard(timeFilter, userId)
      .then(async (res: any) => {
        const noData =
          res?.status === "no_data" ||
          (!res?.competitors?.length && !res?.visibility_trend?.length && (res?.truth_score ?? 0) === 0);
        if (noData) {
          try {
            const est: any = await api.getEstimate(userId);
            setData({ ...res, ...est });
            setEstimated(true);
            return;
          } catch { /* fall through */ }
        }
        setData(res);
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [timeFilter, userId]);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      await api.runScan(userId);
      alert("Scan started successfully. Data will refresh shortly.");
      setLoading(true);
      const res = await api.getDashboard(timeFilter, userId);
      setData(res);
    } catch {
      alert("Failed to start scan. Please try again.");
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  const metrics = data
    ? {
        visibility_score: data.visibility_score ?? 0,
        visibility_change: data.visibility_change ?? 0,
        brand_ranking: data.brand_ranking ?? 0,
        brand_ranking_total: data.brand_ranking_total ?? 0,
        claim_accuracy: data.claim_accuracy ?? 0,
        claim_accuracy_change: data.claim_accuracy_change ?? 0,
        active_hallucinations: data.active_hallucinations ?? 0,
        truth_score: data.truth_score ?? 0,
        truth_score_change: data.truth_score_change ?? 0,
      }
    : mockDashboardMetrics;

  const visibilityTrend = data?.visibility_trend?.length
    ? data.visibility_trend.map((d: { date: string; score: number }) => ({ date: d.date, score: d.score }))
    : [];

  const llmBreakdown: LLMBreakdown[] = data?.llm_breakdown?.length
    ? data.llm_breakdown.map((r: any) => ({
        llm_name: r.llm_name ?? "Unknown",
        mention_rate: r.mention_rate ?? 0,
        total_queries: r.total_queries ?? 0,
        avg_rank: r.avg_rank ?? 0,
      }))
    : [];

  const competitors: (CompetitorVisibility & { is_own?: boolean })[] = data?.competitors?.length
    ? data.competitors.map((c: any) => ({
        name: c.name ?? "Unknown",
        visibility_score: c.visibility_score ?? 0,
        change: c.change ?? 0,
        is_own: c.is_own ?? false,
      }))
    : [];

  const hallucinations: typeof mockHallucinations = data?.hallucinations ?? [];

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Time filter bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Dashboard Overview
        </h1>
        <div className="flex items-center gap-3">
          <ExportButton dataType="full" label="Export All" />
          <button
            type="button"
            onClick={handleRunScan}
            disabled={scanning}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {scanning ? "Running…" : "Run Scan"}
          </button>
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

      {/* Estimated banner */}
      {estimated && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          These metrics are <strong>estimated</strong> based on your business profile. Run a scan to get real data.
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">
            AI Visibility Score
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.visibility_score}
            </span>
            <ChangeIndicator value={metrics.visibility_change} suffix=" pts" />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Truth Score</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.truth_score}%
            </span>
            <ChangeIndicator value={metrics.truth_score_change} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Brand Ranking</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              #{metrics.brand_ranking}
            </span>
            <span className="text-sm text-slate-500">
              of {metrics.brand_ranking_total}
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Claim Accuracy</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.claim_accuracy}%
            </span>
            <ChangeIndicator value={metrics.claim_accuracy_change} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">
            Active Hallucinations
          </p>
          <div className="mt-1">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.active_hallucinations}
            </span>
          </div>
        </div>
      </div>

      {/* Visibility Trend Chart */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Visibility Trend
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LLM Breakdown Table */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              LLM Breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    LLM Name
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Mention Rate
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Total Queries
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Avg Rank
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {llmBreakdown.map((row) => (
                  <tr key={row.llm_name} className="hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-slate-900">
                      {row.llm_name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-slate-600">
                      {row.mention_rate}%
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-slate-600">
                      {row.total_queries}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-slate-600">
                      {row.avg_rank}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Competitor Visibility Table */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Competitor Visibility
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Rank
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Visibility Score
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {competitors.map((row, idx) => (
                  <tr
                    key={row.name}
                    className={`hover:bg-slate-50/50 ${
                      row.is_own ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-slate-900">
                      #{idx + 1}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-slate-900">
                      {row.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-slate-600">
                      {row.visibility_score}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <ChangeIndicator value={row.change} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Active Hallucinations Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Active Hallucinations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  LLM
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Query
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Incorrect Claim
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Correct Value
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {hallucinations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-slate-900">
                    {item.llm_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {item.query_text}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {item.claim_value}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {item.verified_value}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <StatusBadge status={item.status} />
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
