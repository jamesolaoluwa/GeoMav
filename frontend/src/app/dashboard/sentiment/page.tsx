"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  mockSentimentTrend,
  mockSentimentByLLM,
  mockQueryResponses,
} from "@/data/mock";
import type { Sentiment } from "@/lib/types";

const TIME_FILTERS = [
  { value: "all_time", label: "All Time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
] as const;

const sentimentStackData = mockSentimentByLLM.map((row) => ({
  llm_name: row.llm_name,
  positive: row.positive,
  neutral: row.neutral,
  negative: row.negative,
}));

const SENTIMENT_STYLES: Record<
  Sentiment,
  { dot: string; text: string }
> = {
  positive: { dot: "bg-green-500", text: "text-green-700" },
  neutral: { dot: "bg-slate-400", text: "text-slate-600" },
  negative: { dot: "bg-red-500", text: "text-red-700" },
};

export default function SentimentPage() {
  const [timeFilter, setTimeFilter] = useState<
    "all_time" | "daily" | "weekly"
  >("all_time");

  return (
    <div className="space-y-6">
      {/* Time filter bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Sentiment</h1>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {TIME_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
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

      {/* Sentiment Trend Chart - Stacked Area */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Sentiment Trend
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockSentimentTrend}>
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
              <Area
                type="monotone"
                dataKey="positive"
                name="Positive"
                stackId="1"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.7}
              />
              <Area
                type="monotone"
                dataKey="neutral"
                name="Neutral"
                stackId="1"
                stroke="#94a3b8"
                fill="#94a3b8"
                fillOpacity={0.7}
              />
              <Area
                type="monotone"
                dataKey="negative"
                name="Negative"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.7}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment By LLM - Stacked Horizontal Bars */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Sentiment by LLM
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sentimentStackData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="llm_name"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                width={55}
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

      {/* Sentiment by Query Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Sentiment by Query
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
                  Sentiment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mockQueryResponses.map((row) => {
                const style = SENTIMENT_STYLES[row.sentiment];
                return (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-sm text-slate-900">
                      {row.query}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-slate-900">
                      {row.llm_name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 capitalize ${style.text}`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                          aria-hidden
                        />
                        {row.sentiment}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
