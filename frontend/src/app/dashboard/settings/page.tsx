"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const DEFAULT_PROFILE = {
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

function getInitials(displayName: string | undefined, email: string | undefined): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isDummyUser } = useUser();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const userDisplayName =
    user
      ? ((user.user_metadata as Record<string, string> | undefined)?.display_name ||
        (user.user_metadata as Record<string, string> | undefined)?.full_name ||
        user.email ||
        "")
      : "";
  const [displayNameOverride, setDisplayNameOverride] = useState<string | null>(null);
  const displayName = displayNameOverride ?? userDisplayName;
  const [accountSaveStatus, setAccountSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    hallucinations: true,
    weekly_report: true,
    opportunity_alerts: false,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getBusiness()
      .then((data: { name?: string; website?: string; category?: string; description?: string }) => {
        if (cancelled) return;
        setProfile({
          name: String(data?.name ?? DEFAULT_PROFILE.name),
          website: String(data?.website ?? DEFAULT_PROFILE.website),
          category: String(data?.category ?? DEFAULT_PROFILE.category),
          description: String(data?.description ?? DEFAULT_PROFILE.description),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(DEFAULT_PROFILE);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSaveAccount = async () => {
    if (isDummyUser) return;
    setAccountSaveStatus("saving");
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { display_name: displayName } });
      setAccountSaveStatus("saved");
      setTimeout(() => setAccountSaveStatus("idle"), 2000);
    } catch {
      setAccountSaveStatus("error");
      setTimeout(() => setAccountSaveStatus("idle"), 2000);
    }
  };

  const handleChangePassword = async () => {
    if (isDummyUser) return;
    if (newPassword.length < 8) {
      setPasswordStatus("error");
      setTimeout(() => setPasswordStatus("idle"), 2000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setTimeout(() => setPasswordStatus("idle"), 2000);
      return;
    }
    setPasswordStatus("saving");
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ password: newPassword });
      setPasswordStatus("saved");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordStatus("idle"), 2000);
    } catch {
      setPasswordStatus("error");
      setTimeout(() => setPasswordStatus("idle"), 2000);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDummyUser || !user || deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await api.deleteAccount(user.id);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setDeleting(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaveStatus("saving");
    try {
      await api.updateBusiness({
        name: profile.name,
        website: profile.website,
        category: profile.category,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleNotification = (id: string) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <div className="mb-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 w-48 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-10 w-28 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <div className="mb-4 h-6 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-24 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-10 w-32 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <div className="mb-4 h-6 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            ))}
            <div className="h-10 w-28 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
          <div className="mb-4 h-6 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

      {/* Account Profile */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Account
        </h2>
        <div className="mb-4 flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold text-white"
            aria-hidden
          >
            {getInitials(
              (user?.user_metadata as Record<string, string> | undefined)?.display_name,
              user?.email ?? undefined
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {displayName || user?.email || "User"}
            </p>
            <p className="truncate text-sm text-slate-500">{user?.email ?? "—"}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-medium text-slate-700"
            >
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayNameOverride(e.target.value)}
              disabled={isDummyUser}
              placeholder="Your name"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="account-email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="account-email"
              type="email"
              value={user?.email ?? ""}
              readOnly
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveAccount}
            disabled={accountSaveStatus === "saving" || isDummyUser}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {accountSaveStatus === "saving"
              ? "Saving..."
              : accountSaveStatus === "saved"
                ? "Saved!"
                : accountSaveStatus === "error"
                  ? "Error"
                  : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Change Password
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-slate-700"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isDummyUser}
              placeholder="Min 8 characters"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-slate-700"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isDummyUser}
              placeholder="Confirm new password"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={passwordStatus === "saving" || isDummyUser}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {passwordStatus === "saving"
              ? "Saving..."
              : passwordStatus === "saved"
                ? "Saved!"
                : passwordStatus === "error"
                  ? "Error"
                  : "Change Password"}
          </button>
        </div>
      </div>

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
            onClick={handleSaveProfile}
            disabled={saveStatus === "saving"}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Error" : "Save Profile"}
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

      {/* Danger Zone */}
      <div className="rounded-xl border-2 border-red-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-red-700">Danger Zone</h2>
        <p className="mb-4 text-sm text-slate-600">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          disabled={isDummyUser}
          className="rounded-lg border-2 border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70"
        >
          Delete Account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 id="delete-modal-title" className="mb-4 text-lg font-semibold text-slate-900">
              Delete Account
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              This will permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mb-4 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirm("");
                }}
                disabled={deleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== "DELETE"}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
