"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useUserId, useUserLoading } from "@/lib/UserContext";
import type { JourneyData } from "@/lib/types";

const PHASE_LABELS = [
  "Onboarding",
  "Baseline Audit",
  "Actions",
  "Agents",
  "Corrections",
  "Growth",
];

export default function PhaseStepper() {
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const pathname = usePathname();
  const userId = useUserId();
  const userLoading = useUserLoading();

  useEffect(() => {
    if (userLoading) return;
    api
      .getJourney(userId)
      .then((data) => setJourney(data as JourneyData))
      .catch(() => {});
  }, [pathname, userId, userLoading]);

  if (userLoading || !journey) return null;

  const currentPhase = journey.current_phase ?? 1;

  if (currentPhase > 2) return null;

  return (
    <div className="flex items-center gap-1">
      {PHASE_LABELS.map((label, i) => {
        const phaseNum = i + 1;
        const isCompleted = phaseNum < currentPhase;
        const isCurrent = phaseNum === currentPhase;

        return (
          <div key={label} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                ) : (
                  phaseNum
                )}
              </div>
              <span
                className={`hidden text-xs font-medium xl:inline ${
                  isCurrent ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < PHASE_LABELS.length - 1 && (
              <div
                className={`h-px w-4 ${
                  isCompleted ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
