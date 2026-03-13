"use client";

import { createContext, useContext } from "react";

interface UserCtx {
  userId: string | null;
  userLoading: boolean;
}

export const UserContext = createContext<UserCtx>({ userId: null, userLoading: true });

export function useUserId(): string | null {
  return useContext(UserContext).userId;
}

export function useUserLoading(): boolean {
  return useContext(UserContext).userLoading;
}
