"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { mockShoppingResults } from "@/data/mock";
import type { TimeFilter, LLMName, ShoppingResult } from "@/lib/types";

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all_time", label: "All Time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const LLM_COLORS: Record<LLMName, string> = {
  ChatGPT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Gemini: "bg-blue-100 text-blue-800 border-blue-200",
  Claude: "bg-amber-100 text-amber-800 border-amber-200",
  Perplexity: "bg-violet-100 text-violet-800 border-violet-200",
  Bing: "bg-sky-100 text-sky-800 border-sky-200",
  DeepSeek: "bg-teal-100 text-teal-800 border-teal-200",
};

function LLMBadge({ name }: { name: LLMName }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        LLM_COLORS[name] ?? "bg-slate-100 text-slate-800 border-slate-200"
      }`}
    >
      {name}
    </span>
  );
}

function isShoppingResultArray(arr: unknown): arr is ShoppingResult[] {
  if (!Array.isArray(arr)) return false;
  if (arr.length === 0) return true;
  const first = arr[0] as ShoppingResult;
  return typeof first?.query === "string" && typeof first?.llm_name === "string";
}

export default function ShoppingPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all_time");
  const [results, setResults] = useState<ShoppingResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getShopping(timeFilter)
      .then((data: unknown) => {
        if (cancelled) return;
        const d = data as Record<string, unknown>;
        const arr = d?.results ?? d?.shopping_results ?? d?.data;
        if (isShoppingResultArray(arr)) {
          setResults(arr);
        } else {
          setResults([]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [timeFilter]);

  const { products, llms, matrix } = useMemo(() => {
    const products = [...new Set(results.map((r) => r.product_mentioned))].sort();
    const llms = [...new Set(results.map((r) => r.llm_name))].sort();
    const matrix = new Map<string, Set<string>>();
    results.forEach((r) => {
      if (!matrix.has(r.product_mentioned)) {
        matrix.set(r.product_mentioned, new Set());
      }
      matrix.get(r.product_mentioned)!.add(r.llm_name);
    });
    return { products, llms, matrix };
  }, [results]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Shopping</h1>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 animate-pulse">
            <div className="h-10 w-20 rounded-md bg-slate-200" />
            <div className="h-10 w-16 rounded-md bg-slate-200" />
            <div className="h-10 w-20 rounded-md bg-slate-200" />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <div className="mb-4 h-6 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="overflow-x-auto">
            <div className="h-12 w-full rounded bg-slate-100 animate-pulse" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="mt-2 h-12 w-full rounded bg-slate-50 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <div className="mb-4 h-6 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="h-48 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time filter bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Shopping</h1>
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

      {/* Shopping Results Table */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Shopping Results
        </h2>
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
                  Product Mentioned
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Rank
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Context
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {results.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">
                    {row.query}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <LLMBadge name={row.llm_name} />
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {row.product_mentioned}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-600">
                    {row.rank != null ? `#${row.rank}` : "Not ranked"}
                  </td>
                  <td className="max-w-xs px-5 py-3 text-sm text-slate-600">
                    {row.context}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Mention Matrix */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Product Mention Matrix
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Which products appear across which LLMs
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Product
                </th>
                {llms.map((llm) => (
                  <th
                    key={llm}
                    className="border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-600"
                  >
                    {llm}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product} className="hover:bg-slate-50/50">
                  <td className="border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900">
                    {product}
                  </td>
                  {llms.map((llm) => {
                    const mentioned = matrix.get(product)?.has(llm) ?? false;
                    return (
                      <td
                        key={llm}
                        className="border border-slate-200 px-4 py-3 text-center"
                      >
                        {mentioned ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
