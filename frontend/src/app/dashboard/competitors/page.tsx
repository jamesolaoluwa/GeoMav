"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import {
  mockCompetitors,
  mockLLMBreakdown,
  mockSentimentByLLM,
} from "@/data/mock";

const BRAND_COLOR = "#6366f1";
const COMPETITOR_COLOR = "#94a3b8";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-80 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
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
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-80 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export default function CompetitorsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getCompetitors()
      .then((res: any) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const competitors =
    data?.competitors?.length > 0
      ? data.competitors.map((c: { name: string; visibility_score: number; trend?: string }) => ({
          name: c.name,
          visibility_score: c.visibility_score,
          change: c.trend === "up" ? 1 : c.trend === "down" ? -1 : 0,
        }))
      : [];

  const llmBreakdown =
    data?.llm_breakdown?.length > 0
      ? data.llm_breakdown
      : [];

  const sentimentChartData =
    data?.sentiment_by_llm?.length > 0
      ? data.sentiment_by_llm.map((row: { llm_name: string; positive: number; neutral: number; negative: number }) => ({
          llm_name: row.llm_name,
          positive: row.positive,
          neutral: row.neutral,
          negative: row.negative,
        }))
      : [];

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Competitor Visibility Ranking Chart */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Competitor Visibility Ranking
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={competitors}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) => [String(value), "Visibility Score"]}
              />
              <Bar dataKey="visibility_score" name="Visibility Score" radius={[0, 4, 4, 0]}>
                {competitors.map((entry: { name: string; visibility_score: number; change: number }) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === "Your Brand" ? BRAND_COLOR : COMPETITOR_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mention Frequency Table */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Mention Frequency
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
                    Mention Rate (%)
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
                {llmBreakdown.map((row: { llm_name: string; mention_rate: number; total_queries: number; avg_rank: number }, idx: number) => (
                  <tr
                    key={row.llm_name}
                    className={idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"}
                  >
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

        {/* Sentiment Comparison Chart */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Sentiment Comparison by LLM
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sentimentChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="llm_name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [`${value}%`, ""]}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Bar dataKey="positive" name="Positive" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="neutral" name="Neutral" fill="#94a3b8" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="negative" name="Negative" fill="#ef4444" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
