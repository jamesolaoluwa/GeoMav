"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const DUMMY_USER: User = {
  id: "demo-user-001",
  email: "demo@geomav.com",
  user_metadata: { display_name: "Demo User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data: { user: u }, error }) => {
        if (cancelled) return;
        if (error || !u) {
          setUser(DUMMY_USER);
        } else {
          setUser(u);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(DUMMY_USER);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isDummyUser = user?.id === DUMMY_USER.id;

  return { user, loading, isDummyUser };
}
