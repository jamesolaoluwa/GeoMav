"use client";

import { useState } from "react";
import { mockPrompts } from "@/data/mock";
import type { Prompt } from "@/lib/types";

const CATEGORIES = [
  "General",
  "Pricing",
  "E-commerce",
  "Hosting",
  "Features",
  "SEO",
  "Design",
  "Industry",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-gray-100 text-gray-800 border-gray-200",
  Pricing: "bg-green-100 text-green-800 border-green-200",
  "E-commerce": "bg-purple-100 text-purple-800 border-purple-200",
  Hosting: "bg-blue-100 text-blue-800 border-blue-200",
  Features: "bg-orange-100 text-orange-800 border-orange-200",
  SEO: "bg-teal-100 text-teal-800 border-teal-200",
  Design: "bg-pink-100 text-pink-800 border-pink-200",
  Industry: "bg-amber-100 text-amber-800 border-amber-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<string>(CATEGORIES[0]);

  const handleAdd = () => {
    if (!newText.trim()) return;
    const prompt: Prompt = {
      id: `p${Date.now()}`,
      text: newText.trim(),
      category: newCategory,
      created_at: new Date().toISOString(),
    };
    setPrompts((prev) => [prompt, ...prev]);
    setNewText("");
    setNewCategory(CATEGORIES[0]);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Prompts</h1>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
        >
          Add Prompt
        </button>
      </div>

      {/* Add Prompt Form */}
      {showAddForm && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Add New Prompt
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="prompt-text"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Prompt text
              </label>
              <input
                id="prompt-text"
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter prompt text..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <div>
              <label
                htmlFor="prompt-category"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Category
              </label>
              <select
                id="prompt-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewText("");
                  setNewCategory(CATEGORIES[0]);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompts Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Prompt
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Category
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Date Added
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {prompts.map((prompt) => (
                <tr key={prompt.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-sm text-slate-900">
                    {prompt.text}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        CATEGORY_COLORS[prompt.category] ??
                        "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {prompt.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-600">
                    {formatDate(prompt.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(prompt.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete prompt"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
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
