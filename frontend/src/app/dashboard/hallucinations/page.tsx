"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { mockHallucinations } from "@/data/mock";
import type { Claim, ClaimStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: "pending", label: "Pending fix" },
  { value: "correction_deployed", label: "Correction deployed" },
  { value: "resolved", label: "Resolved" },
];

function StatusSelect({
  value,
  onChange,
}: {
  value: ClaimStatus;
  onChange: (v: ClaimStatus) => void;
}) {
  const baseStyles =
    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1";
  const statusStyles: Record<ClaimStatus, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    correction_deployed: "border-blue-200 bg-blue-50 text-blue-800",
    resolved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ClaimStatus)}
      className={`${baseStyles} ${statusStyles[value]}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="overflow-x-auto p-5">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex gap-4"
              >
                <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HallucinationsPage() {
  const [hallucinations, setHallucinations] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getHallucinations()
      .then((res: any) => {
        const raw = res.claims ?? [];
        const mapped: Claim[] = raw.map((c: any) => ({
          id: String(c.id),
          response_id: String(c.response_id ?? ""),
          claim_type: String(c.claim_type ?? ""),
          claim_value: String(c.claim_value ?? c.claim ?? ""),
          verified_value: String(c.verified_value ?? c.actual ?? ""),
          status: (c.status as ClaimStatus) ?? "pending",
          llm_name: (c.llm_name ?? c.llm) as Claim["llm_name"],
          query_text: String(c.query_text ?? c.query ?? ""),
          created_at: String(c.created_at ?? ""),
        }));
        setHallucinations(mapped);
      })
      .catch(() => {
        setHallucinations(mockHallucinations);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (id: string, status: ClaimStatus) => {
    const prev = hallucinations.find((h) => h.id === id);
    if (!prev) return;
    const previousStatus = prev.status;

    setHallucinations((h) =>
      h.map((item) => (item.id === id ? { ...item, status } : item))
    );

    api
      .updateHallucination(id, status)
      .catch(() => {
        alert("Failed to update status. Reverting.");
        setHallucinations((h) =>
          h.map((item) =>
            item.id === id ? { ...item, status: previousStatus } : item
          )
        );
      });
  };

  if (loading) return <LoadingSkeleton />;

  const total = hallucinations.length;
  const pending = hallucinations.filter((h) => h.status === "pending").length;
  const deployed = hallucinations.filter(
    (h) => h.status === "correction_deployed"
  ).length;
  const resolved = hallucinations.filter((h) => h.status === "resolved").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Hallucinations</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">
            Total Hallucinations
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Deployed</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{deployed}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-medium text-slate-500">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{resolved}</p>
        </div>
      </div>

      {/* Hallucinations table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Hallucinations
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
                    <StatusSelect
                      value={item.status}
                      onChange={(status) => updateStatus(item.id, status)}
                    />
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
