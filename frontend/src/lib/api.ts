const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getDashboard: (filter?: string) =>
    apiFetch(`/api/dashboard${filter ? `?filter=${filter}` : ""}`),

  getVisibility: (filter?: string) =>
    apiFetch(`/api/visibility${filter ? `?filter=${filter}` : ""}`),

  getHallucinations: () => apiFetch("/api/hallucinations"),

  updateHallucination: (id: string, status: string) =>
    apiFetch(`/api/hallucinations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getPrompts: () => apiFetch("/api/prompts"),

  addPrompt: (text: string, category: string) =>
    apiFetch("/api/prompts", {
      method: "POST",
      body: JSON.stringify({ text, category }),
    }),

  deletePrompt: (id: string) =>
    apiFetch(`/api/prompts/${id}`, { method: "DELETE" }),

  getCompetitors: () => apiFetch("/api/competitors"),

  getSentiment: (filter?: string) =>
    apiFetch(`/api/sentiment${filter ? `?filter=${filter}` : ""}`),

  getShopping: (filter?: string) =>
    apiFetch(`/api/shopping${filter ? `?filter=${filter}` : ""}`),

  getOpportunities: () => apiFetch("/api/opportunities"),

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

  runScan: () => apiFetch("/api/run-scan", { method: "POST" }),

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

  getBusiness: () => apiFetch("/api/business"),

  updateBusiness: (data: Record<string, unknown>) =>
    apiFetch("/api/business", {
      method: "PUT",
      body: JSON.stringify(data),
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
};
