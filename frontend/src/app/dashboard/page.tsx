"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  mockDashboardMetrics,
  mockVisibilityTrend,
  mockLLMBreakdown,
  mockCompetitors,
  mockHallucinations,
} from "@/data/mock";
import type { TimeFilter, ClaimStatus } from "@/lib/types";

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

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all_time");
  const metrics = mockDashboardMetrics;

  return (
    <div className="space-y-6">
      {/* Time filter bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Dashboard Overview
        </h1>
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

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <LineChart data={mockVisibilityTrend}>
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
                {mockLLMBreakdown.map((row) => (
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
                {mockCompetitors.map((row, idx) => (
                  <tr
                    key={row.name}
                    className={`hover:bg-slate-50/50 ${
                      row.name === "Your Brand" ? "bg-blue-50/50" : ""
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
              {mockHallucinations.map((item) => (
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
