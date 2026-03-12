"use client";

import { useState } from "react";

const SAMPLE_BUSINESS = {
  name: "Your Brand",
  website: "https://yourbrand.com",
  category: "Website Builder",
  description:
    "Your Brand is a modern website builder and hosting platform designed for small businesses, freelancers, and creative professionals.",
};

const CATEGORIES = [
  "Website Builder",
  "E-commerce Platform",
  "Hosting Provider",
  "Design Tools",
  "SEO Tools",
  "Other",
];

const API_KEYS = [
  { id: "openai", label: "OpenAI API Key", placeholder: "sk-..." },
  { id: "anthropic", label: "Anthropic API Key", placeholder: "sk-ant-..." },
  { id: "gemini", label: "Google Gemini API Key", placeholder: "AIza..." },
  { id: "perplexity", label: "Perplexity API Key", placeholder: "pplx-..." },
];

const NOTIFICATIONS = [
  { id: "hallucinations", label: "Email notifications for new hallucinations" },
  { id: "weekly_report", label: "Weekly visibility report" },
  { id: "opportunity_alerts", label: "Opportunity alerts" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState(SAMPLE_BUSINESS);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    hallucinations: true,
    weekly_report: true,
    opportunity_alerts: false,
  });

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleNotification = (id: string) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

      {/* Business Profile */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Business Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="business-name"
              className="block text-sm font-medium text-slate-700"
            >
              Business Name
            </label>
            <input
              id="business-name"
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-slate-700"
            >
              Website URL
            </label>
            <input
              id="website"
              type="url"
              value={profile.website}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, website: e.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-slate-700"
            >
              Category
            </label>
            <select
              id="category"
              value={profile.category}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, category: e.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={profile.description}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, description: e.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Save Profile
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">API Keys</h2>
        <div className="space-y-4">
          {API_KEYS.map(({ id, label, placeholder }) => (
            <div key={id}>
              <label
                htmlFor={id}
                className="block text-sm font-medium text-slate-700"
              >
                {label}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id={id}
                  type={showKeys[id] ? "text" : "password"}
                  value={apiKeys[id] ?? ""}
                  onChange={(e) =>
                    setApiKeys((prev) => ({ ...prev, [id]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className="block flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(id)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={showKeys[id] ? "Hide" : "Show"}
                >
                  {showKeys[id] ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Save Keys
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Notifications
        </h2>
        <div className="space-y-4">
          {NOTIFICATIONS.map(({ id, label }) => (
            <label
              key={id}
              htmlFor={id}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3"
            >
              <span className="text-sm text-slate-700">{label}</span>
              <input
                id={id}
                type="checkbox"
                checked={notifications[id] ?? false}
                onChange={() => toggleNotification(id)}
                className="peer sr-only"
              />
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 ${
                  notifications[id] ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    notifications[id] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
