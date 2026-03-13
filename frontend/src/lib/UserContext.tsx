"use client";

import { createContext, useContext } from "react";

interface UserCtx {
  userId: string | null;
}

export const UserContext = createContext<UserCtx>({ userId: null });

export function useUserId(): string | null {
  return useContext(UserContext).userId;
}
