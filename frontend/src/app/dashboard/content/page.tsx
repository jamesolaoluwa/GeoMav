"use client";

import { useState } from "react";
import { mockContentSections } from "@/data/mock";
import type { ContentSection } from "@/lib/types";

const TABS: { value: ContentSection["type"]; label: string }[] = [
  { value: "summary", label: "AI Summary" },
  { value: "llms_txt", label: "llms.txt" },
  { value: "json_ld", label: "JSON-LD" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="prose prose-slate max-w-none text-sm">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-lg font-bold text-slate-900">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-4 text-base font-semibold text-slate-800">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="ml-4 text-slate-600">
              {line.slice(2)}
            </li>
          );
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-slate-200 pl-4 italic text-slate-600"
            >
              {line.slice(2)}
            </blockquote>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        return (
          <p key={i} className="text-slate-600">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<ContentSection["type"]>("summary");
  const [editedContent, setEditedContent] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        mockContentSections.map((s) => [s.id, s.content])
      )
  );

  const section = mockContentSections.find((s) => s.type === activeTab);
  if (!section) return null;

  const content = editedContent[section.id] ?? section.content;

  const handleSave = () => {
    // Placeholder - in real app would persist
    console.log("Save", section.id, content);
  };

  const handleDeploy = () => {
    // Placeholder - in real app would deploy
    console.log("Deploy", section.id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Content</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {section.title}
          </h2>
          <p className="text-xs text-slate-500">
            Last updated: {formatDate(section.updated_at)}
          </p>
        </div>

        {/* Preview area */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Preview
          </p>
          {section.type === "json_ld" ? (
            <pre className="overflow-x-auto rounded bg-slate-100 p-4 font-mono text-xs text-slate-700">
              {content}
            </pre>
          ) : (
            <div className="rounded bg-slate-100 p-4">
              <MarkdownPreview content={content} />
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Edit content
          </label>
          <textarea
            value={content}
            onChange={(e) =>
              setEditedContent((prev) => ({
                ...prev,
                [section.id]: e.target.value,
              }))
            }
            rows={14}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            spellCheck={false}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
          <button
            onClick={handleDeploy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Deploy
          </button>
        </div>
      </div>
    </div>
  );
}
