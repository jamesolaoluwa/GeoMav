"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useUserId } from "@/lib/UserContext";
import type { AgentMetrics, AgentSettings } from "@/lib/types";

const ALL_LLMS = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Bing", "DeepSeek"];
const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

const AGENT_LABELS: Record<string, string> = {
  analytics: "Analytics Agent",
  enrichment: "Enrichment Agent",
  reinforcement: "Reinforcement Agent",
};

const AGENT_DESCRIPTIONS: Record<string, string> = {
  analytics: "Queries LLM APIs, stores responses, extracts brand mentions, and calculates visibility metrics.",
  enrichment: "Generates AI-optimized content: summaries, FAQ, JSON-LD, and /llms.txt files.",
  reinforcement: "Compares AI responses against your truth store, classifies claims, and generates corrections.",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userId = useUserId();

  useEffect(() => {
    Promise.all([
      api.getAgentMetrics(userId).then((res) => {
        const r = res as { agents?: AgentMetrics[] };
        setMetrics(r.agents || []);
      }),
      api.getAgentSettings(userId).then((res) => {
        const r = res as Partial<AgentSettings>;
        setSettings({
          monitored_llms: r.monitored_llms || ALL_LLMS,
          scan_frequency: r.scan_frequency || "weekly",
          scan_hour: r.scan_hour ?? 9,
          auto_deploy_corrections: r.auto_deploy_corrections ?? false,
        });
      }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
  await api.updateAgentSettings(settings as unknown as Record<string, unknown>);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const toggleLLM = (llm: string) => {
    if (!settings) return;
    const current = settings.monitored_llms;
    const updated = current.includes(llm)
      ? current.filter((l) => l !== llm)
      : [...current, llm];
    setSettings({ ...settings, monitored_llms: updated });
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Agent Operations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor agent performance and configure scan settings.
        </p>
      </div>

      {/* Agent metric cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {(["analytics", "enrichment", "reinforcement"] as const).map((agentType) => {
          const agent = metrics.find((m) => m.agent_type === agentType);
          return (
            <div key={agentType} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  agentType === "analytics" ? "bg-blue-100" : agentType === "enrichment" ? "bg-emerald-100" : "bg-purple-100"
                }`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={
                    agentType === "analytics" ? "#3b82f6" : agentType === "enrichment" ? "#10b981" : "#8b5cf6"
                  } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{AGENT_LABELS[agentType]}</h3>
                  <p className="text-xs text-slate-500">{AGENT_DESCRIPTIONS[agentType]}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Runs</p>
                  <p className="text-lg font-semibold text-slate-900">{agent?.total_runs ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Success Rate</p>
                  <p className="text-lg font-semibold text-slate-900">{agent?.success_rate ?? 0}%</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Items Processed</p>
                  <p className="text-lg font-semibold text-slate-900">{agent?.total_items_processed ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Errors</p>
                  <p className="text-lg font-semibold text-slate-900">{agent?.total_errors ?? 0}</p>
                </div>
              </div>

              {agent?.last_run && (
                <div className="mt-3 rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-medium text-slate-500">Last Run</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex h-2 w-2 rounded-full ${
                      agent.last_run.status === "completed" ? "bg-emerald-500" : agent.last_run.status === "running" ? "bg-blue-500 animate-pulse" : "bg-red-500"
                    }`} />
                    <span className="text-sm text-slate-700 capitalize">{agent.last_run.status}</span>
                    {agent.last_run.duration_ms != null && (
                      <span className="text-xs text-slate-400">({(agent.last_run.duration_ms / 1000).toFixed(1)}s)</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {agent.last_run.started_at ? new Date(agent.last_run.started_at).toLocaleString() : "—"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Configure Agents */}
      {settings && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">Configure Agents</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose which LLMs to monitor and set your scan schedule.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Monitored LLMs</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_LLMS.map((llm) => (
                  <button
                    key={llm}
                    type="button"
                    onClick={() => toggleLLM(llm)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      settings.monitored_llms.includes(llm)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {llm}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Scan Frequency</label>
                <select
                  value={settings.scan_frequency}
                  onChange={(e) => setSettings({ ...settings, scan_frequency: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Scan Hour (UTC)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.scan_hour}
                  onChange={(e) => setSettings({ ...settings, scan_hour: parseInt(e.target.value) || 9 })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
              <span className="text-sm text-slate-700">Auto-deploy corrections</span>
              <input
                type="checkbox"
                checked={settings.auto_deploy_corrections}
                onChange={(e) => setSettings({ ...settings, auto_deploy_corrections: e.target.checked })}
                className="peer sr-only"
              />
              <span className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.auto_deploy_corrections ? "bg-blue-600" : "bg-slate-200"
              }`}>
                <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  settings.auto_deploy_corrections ? "translate-x-5" : "translate-x-0"
                }`} />
              </span>
            </label>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
