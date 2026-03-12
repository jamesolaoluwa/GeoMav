"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
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

function normalizeSection(s: { id: string; section?: string; type?: string; title: string; content: string; updated_at: string }): ContentSection {
  const type = (s.type ?? s.section ?? "summary") as ContentSection["type"];
  return { id: s.id, type, title: s.title, content: s.content, updated_at: s.updated_at };
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<ContentSection["type"]>("summary");
  const [sections, setSections] = useState<ContentSection[]>(mockContentSections);
  const [loading, setLoading] = useState(true);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deployStatus, setDeployStatus] = useState<"idle" | "deploying" | "deployed" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getContent()
      .then((res: any) => {
        if (cancelled) return;
        const raw = res?.sections ?? [];
        if (Array.isArray(raw) && raw.length > 0) {
          const normalized = raw.map((s) => normalizeSection(s as Parameters<typeof normalizeSection>[0]));
          setSections(normalized);
          setEditedContent(Object.fromEntries(normalized.map((s) => [s.id, s.content])));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSections(mockContentSections);
        setEditedContent(Object.fromEntries(mockContentSections.map((s) => [s.id, s.content])));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const section = sections.find((s) => s.type === activeTab);
  const content = section ? (editedContent[section.id] ?? section.content) : "";

  const handleSave = async () => {
    if (!section) return;
    setSaveStatus("saving");
    try {
      await api.updateContent(section.id, content);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleDeploy = async () => {
    if (!section) return;
    setDeployStatus("deploying");
    try {
      await api.deployCorrection({
        claim_id: section.id,
        correction_type: section.type,
        content,
      });
      setDeployStatus("deployed");
      setTimeout(() => setDeployStatus("idle"), 2000);
    } catch {
      setDeployStatus("error");
      setTimeout(() => setDeployStatus("idle"), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Content</h1>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 animate-pulse">
          <div className="h-10 flex-1 rounded-md bg-slate-200" />
          <div className="h-10 flex-1 rounded-md bg-slate-200" />
          <div className="h-10 flex-1 rounded-md bg-slate-200" />
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <div className="mb-4 h-6 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="mb-6 h-64 rounded-lg bg-slate-100 animate-pulse" />
          <div className="mb-6 h-64 rounded-lg bg-slate-100 animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-32 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-10 w-24 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!section) return null;

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
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Error" : "Save Changes"}
          </button>
          <button
            onClick={handleDeploy}
            disabled={deployStatus === "deploying"}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {deployStatus === "deploying" ? "Deploying..." : deployStatus === "deployed" ? "Deployed!" : deployStatus === "error" ? "Error" : "Deploy"}
          </button>
        </div>
      </div>
    </div>
  );
}
