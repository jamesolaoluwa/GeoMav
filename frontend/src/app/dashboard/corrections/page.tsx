"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useUserId } from "@/lib/UserContext";
import type { ClaimEvent } from "@/lib/types";

const EVENT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  detected: { color: "text-red-700", bg: "bg-red-500", label: "Wrong Claim Detected" },
  content_generated: { color: "text-blue-700", bg: "bg-blue-500", label: "Content Generated" },
  correction_deployed: { color: "text-emerald-700", bg: "bg-emerald-500", label: "Correction Deployed" },
  requery_24h: { color: "text-amber-700", bg: "bg-amber-500", label: "Re-query Check (24h)" },
  requery_48h: { color: "text-amber-700", bg: "bg-amber-500", label: "Re-query Check (48h)" },
  requery_72h: { color: "text-amber-700", bg: "bg-amber-500", label: "Re-query Check (72h)" },
  resolved: { color: "text-emerald-700", bg: "bg-emerald-500", label: "Resolved" },
  escalated: { color: "text-red-700", bg: "bg-red-500", label: "Escalated" },
};

interface CorrectionsOverview {
  total_claims: number;
  pending: number;
  correction_deployed: number;
  resolved: number;
  resolution_rate: number;
  pipeline: {
    detected: number;
    content_deployed: number;
    requery_complete: number;
    resolved: number;
  };
}

interface ClaimTimelineData {
  claim: {
    id: string;
    claim_value: string;
    verified_value: string;
    status: string;
    claim_type: string;
    created_at: string;
  } | null;
  events: ClaimEvent[];
}

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
    </div>
  );
}

function TimelineView({ events }: { events: ClaimEvent[] }) {
  return (
    <div className="relative ml-4 border-l-2 border-slate-200 pl-6">
      {events.map((event, i) => {
        const style = EVENT_STYLES[event.event_type] || EVENT_STYLES.detected;
        return (
          <div key={event.id || i} className="relative mb-6 last:mb-0">
            <div className={`absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full ${style.bg}`}>
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className={`text-sm font-medium ${style.color}`}>{style.label}</p>
              {event.description && (
                <p className="mt-1 text-sm text-slate-600">{event.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {event.created_at ? new Date(event.created_at).toLocaleString() : "—"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CorrectionsPage() {
  const [overview, setOverview] = useState<CorrectionsOverview | null>(null);
  const [claims, setClaims] = useState<{ id: string; claim: string; actual: string; status: string; llm?: string }[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<ClaimTimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const userId = useUserId();

  useEffect(() => {
    Promise.all([
      api.getCorrectionsOverview(userId).then((res) => setOverview(res as CorrectionsOverview)),
      api.getHallucinations(userId).then((res) => {
        const r = res as { claims?: { id: string; claim: string; actual: string; status: string; llm?: string }[] };
        setClaims(r.claims || []);
      }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const loadTimeline = async (claimId: string) => {
    setSelectedClaim(claimId);
    setTimelineLoading(true);
    try {
      const res = await api.getClaimTimeline(claimId) as ClaimTimelineData;
      setTimeline(res);
    } catch {
      setTimeline(null);
    } finally {
      setTimelineLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Correction Timeline</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track the lifecycle of each correction: detection, deployment, re-query verification, and resolution.
        </p>
      </div>

      {/* Pipeline overview */}
      {overview && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
              <p className="text-sm font-medium text-slate-500">Detected</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{overview.pipeline.detected}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
              <p className="text-sm font-medium text-slate-500">Content Deployed</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{overview.pipeline.content_deployed}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
              <p className="text-sm font-medium text-slate-500">Re-query Complete</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{overview.pipeline.requery_complete}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
              <p className="text-sm font-medium text-slate-500">Resolved</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{overview.pipeline.resolved}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-slate-500">Resolution Rate</p>
              <div className="flex-1">
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${overview.resolution_rate}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-900">{overview.resolution_rate}%</span>
            </div>
          </div>
        </>
      )}

      {/* Claims list + timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Claims</h2>
          {claims.map((claim) => (
            <button
              key={claim.id}
              type="button"
              onClick={() => loadTimeline(claim.id)}
              className={`block w-full rounded-xl border p-4 text-left transition-colors ${
                selectedClaim === claim.id
                  ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-2 w-2 rounded-full ${
                  claim.status === "resolved" ? "bg-emerald-500" : claim.status === "correction_deployed" ? "bg-blue-500" : "bg-amber-500"
                }`} />
                <span className="text-sm font-medium text-slate-900 capitalize">{claim.status?.replace("_", " ")}</span>
                {claim.llm && (
                  <span className="text-xs text-slate-400">{claim.llm}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-700">{claim.claim}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Correct: {claim.actual}
              </p>
            </button>
          ))}
          {claims.length === 0 && (
            <p className="text-sm text-slate-500">No claims found.</p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
          {timelineLoading ? (
            <div className="mt-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : timeline?.events && timeline.events.length > 0 ? (
            <div className="mt-4">
              {timeline.claim && (
                <div className="mb-4 rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-900">
                    {timeline.claim.claim_type}: {timeline.claim.claim_value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Verified: {timeline.claim.verified_value}
                  </p>
                </div>
              )}
              <TimelineView events={timeline.events} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Select a claim to view its correction timeline.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
