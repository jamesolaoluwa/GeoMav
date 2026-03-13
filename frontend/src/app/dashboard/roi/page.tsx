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
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { useUserId } from "@/lib/UserContext";
import type { ROIDashboard } from "@/lib/types";

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
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <div className="h-64 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function ROIPage() {
  const [data, setData] = useState<ROIDashboard | null>(null);
  interface AgentReportData {
    latest?: {
      analytics?: { runs: number; completed: number; items_processed: number };
      enrichment?: { runs: number; completed: number; items_processed: number };
      reinforcement?: { runs: number; completed: number; items_processed: number };
      summary?: { claims_resolved: number; content_sections: number };
      [key: string]: unknown;
    };
    reports?: {
      id: string;
      report_period_start: string;
      report_period_end: string;
      summary?: string;
      claims_resolved?: number;
      content_deployed?: number;
    }[];
  }
  const [agentReport, setAgentReport] = useState<AgentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();

  useEffect(() => {
    Promise.all([
      api.getROI(userId).then((res) => setData(res as ROIDashboard)),
      api.getAgentPerformanceReport(userId).then((res) => setAgentReport(res as AgentReportData)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Growth & ROI</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track projected growth, trust score trends, and agent performance attribution.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Truth Score</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data?.truth_score ?? 0}%</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Claims Resolved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{data?.claims_resolved ?? 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">of {data?.total_claims ?? 0} total</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Content Deployed</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{data?.content_deployed ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Resolution Rate</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data?.resolution_rate ?? 0}%</p>
        </div>
      </div>

      {/* Projected Growth */}
      {data?.projected_growth && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">Projected Growth</h2>
          <p className="mt-1 text-sm text-slate-500">90-day visibility roadmap vs. actual</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Current</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{data.projected_growth.current}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Projected (90d)</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{data.projected_growth.projected_90d}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Trend</p>
              <p className={`mt-1 text-2xl font-bold capitalize ${
                data.projected_growth.trend === "improving" ? "text-emerald-600" : data.projected_growth.trend === "declining" ? "text-red-600" : "text-slate-600"
              }`}>{data.projected_growth.trend}</p>
            </div>
          </div>
        </div>
      )}

      {/* Trust Score Trend Chart */}
      {data?.trust_trend && data.trust_trend.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Trust Score Trends</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trust_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="trust_score" name="Trust Score" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="visibility_score" name="Visibility" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="truth_score" name="Truth Score" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Agent Performance Report */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="text-lg font-semibold text-slate-900">Agent Performance Report</h2>
        <p className="mt-1 text-sm text-slate-500">
          Per-agent impact attribution and contribution metrics.
        </p>

        {agentReport?.latest ? (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Agent</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Runs</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Completed</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Items Processed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(["analytics", "enrichment", "reinforcement"] as const).map((agent) => {
                    const agentData = agentReport?.latest?.[agent] as { runs?: number; completed?: number; items_processed?: number } | undefined;
                    return (
                      <tr key={agent} className="hover:bg-slate-50/50">
                        <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-slate-900 capitalize">{agent}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-slate-600">{agentData?.runs ?? 0}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-slate-600">{agentData?.completed ?? 0}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-slate-600">{agentData?.items_processed ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {agentReport.latest.summary && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-700">Claims Resolved</p>
                  <p className="mt-1 text-xl font-bold text-emerald-900">
                    {agentReport.latest.summary.claims_resolved}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-700">Content Sections</p>
                  <p className="mt-1 text-xl font-bold text-blue-900">
                    {agentReport.latest.summary.content_sections}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500">No agent performance data yet. Run a scan to start collecting metrics.</p>
          </div>
        )}

        {/* Historical reports */}
        {agentReport?.reports && (agentReport.reports as NonNullable<AgentReportData["reports"]>).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700">Historical Reports</h3>
            <div className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200">
              {(agentReport.reports as NonNullable<AgentReportData["reports"]>).map((report) => (
                <div key={report.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {report.report_period_start} — {report.report_period_end}
                    </p>
                    {report.summary && (
                      <p className="text-xs text-slate-500">{report.summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {report.claims_resolved != null && (
                      <span>{report.claims_resolved} resolved</span>
                    )}
                    {report.content_deployed != null && (
                      <span>{report.content_deployed} deployed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
