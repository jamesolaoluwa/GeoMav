const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function qs(base: string, params: Record<string, string | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}

export const api = {
  getDashboard: (filter?: string, userId?: string | null) =>
    apiFetch(qs("/api/dashboard", { filter, user_id: userId })),

  getVisibility: (filter?: string, userId?: string | null) =>
    apiFetch(qs("/api/visibility", { filter, user_id: userId })),

  getHallucinations: (userId?: string | null) =>
    apiFetch(qs("/api/hallucinations", { user_id: userId })),

  updateHallucination: (id: string, status: string) =>
    apiFetch(`/api/hallucinations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getPrompts: (userId?: string | null) =>
    apiFetch(qs("/api/prompts", { user_id: userId })),

  addPrompt: (text: string, category: string) =>
    apiFetch("/api/prompts", {
      method: "POST",
      body: JSON.stringify({ text, category }),
    }),

  deletePrompt: (id: string) =>
    apiFetch(`/api/prompts/${id}`, { method: "DELETE" }),

  getCompetitors: (userId?: string | null) =>
    apiFetch(qs("/api/competitors", { user_id: userId })),

  getSentiment: (filter?: string, userId?: string | null) =>
    apiFetch(qs("/api/sentiment", { filter, user_id: userId })),

  getShopping: (filter?: string, userId?: string | null) =>
    apiFetch(qs("/api/shopping", { filter, user_id: userId })),

  getOpportunities: (userId?: string | null) =>
    apiFetch(qs("/api/opportunities", { user_id: userId })),

  updateOpportunity: (id: string, status: string) =>
    apiFetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getContent: () => apiFetch("/api/content"),

  updateContent: (id: string, content: string) =>
    apiFetch(`/api/content/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  deployCorrection: (data: Record<string, unknown>) =>
    apiFetch("/api/deploy-correction", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  runScan: (userId?: string | null) =>
    apiFetch(qs("/api/run-scan", { user_id: userId }), { method: "POST" }),

  analyzeWebsite: (url: string) =>
    apiFetch("/api/onboard", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  saveOnboardProfile: (data: Record<string, unknown>) =>
    apiFetch("/api/onboard/save", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  runOnboardScan: (businessId: string) =>
    apiFetch("/api/onboard/scan", {
      method: "POST",
      body: JSON.stringify({ business_id: businessId }),
    }),

  getBusiness: (userId?: string | null) =>
    apiFetch(qs("/api/business", { user_id: userId })),

  updateBusiness: (data: Record<string, unknown>) =>
    apiFetch("/api/business", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  enrichBusiness: () =>
    apiFetch("/api/enrich-business", { method: "POST" }),

  saveApiKeys: (keys: Record<string, string>) =>
    apiFetch("/api/api-keys", {
      method: "PUT",
      body: JSON.stringify(keys),
    }),

  deleteAccount: (userId: string) =>
    apiFetch("/api/user/account", {
      method: "DELETE",
      body: JSON.stringify({ user_id: userId }),
    }),

  getNotificationPrefs: (userId: string) =>
    apiFetch(`/api/notifications/preferences?user_id=${userId}`),

  updateNotificationPrefs: (userId: string, prefs: Record<string, unknown>) =>
    apiFetch("/api/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, ...prefs }),
    }),

  getNotificationLog: (userId: string) =>
    apiFetch(`/api/notifications/log?user_id=${userId}`),

  exportData: (type: string, format: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams({ type, format });
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    return fetch(`${API_BASE}/api/export?${params}`);
  },

  getHistoryComparison: (
    businessId: string,
    p1Start: string,
    p1End: string,
    p2Start: string,
    p2End: string
  ) =>
    apiFetch(
      `/api/history/compare?business_id=${businessId}&period1_start=${p1Start}&period1_end=${p1End}&period2_start=${p2Start}&period2_end=${p2End}`
    ),

  getHistorySnapshots: (businessId: string, from?: string, to?: string) => {
    const params = new URLSearchParams({ business_id: businessId });
    if (from) params.set("date_from", from);
    if (to) params.set("date_to", to);
    return apiFetch(`/api/history/snapshots?${params}`);
  },

  createSnapshot: (businessId?: string) =>
    apiFetch("/api/history/snapshot", {
      method: "POST",
      body: JSON.stringify(businessId ? { business_id: businessId } : {}),
    }),

  getJourney: (userId?: string | null) =>
    apiFetch(qs("/api/journey", { user_id: userId })),

  advanceJourney: (userId?: string | null) =>
    apiFetch(qs("/api/journey/advance", { user_id: userId }), { method: "POST" }),

  getAgentSettings: (userId?: string | null) =>
    apiFetch(qs("/api/agents/settings", { user_id: userId })),

  updateAgentSettings: (data: Record<string, unknown>) =>
    apiFetch("/api/agents/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getAgentMetrics: (userId?: string | null) =>
    apiFetch(qs("/api/agents/metrics", { user_id: userId })),

  getEthicsFlags: (userId?: string | null) =>
    apiFetch(qs("/api/ethics", { user_id: userId })),

  updateEthicsFlag: (id: string, status: string) =>
    apiFetch(`/api/ethics/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getClaimTimeline: (claimId: string) =>
    apiFetch(`/api/corrections/timeline/${claimId}`),

  getCorrectionsOverview: (userId?: string | null) =>
    apiFetch(qs("/api/corrections/overview", { user_id: userId })),

  getROI: (userId?: string | null) =>
    apiFetch(qs("/api/roi", { user_id: userId })),

  getAgentPerformanceReport: (userId?: string | null) =>
    apiFetch(qs("/api/roi/agent-report", { user_id: userId })),

  getEstimate: (userId?: string | null) =>
    apiFetch(qs("/api/estimate", { user_id: userId })),
};
