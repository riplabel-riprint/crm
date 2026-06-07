"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser, UserRole } from "@/types/notifications";

type UserState = {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  login: (user: AppUser) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  updateProfile: (patch: Partial<AppUser>) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      login: (user) => set({ currentUser: user, isAuthenticated: true }),
      logout: () => set({ currentUser: null, isAuthenticated: false }),
      setRole: (role) =>
        set((s) =>
          s.currentUser ? { currentUser: { ...s.currentUser, role } } : {}
        ),
      updateProfile: (patch) =>
        set((s) =>
          s.currentUser ? { currentUser: { ...s.currentUser, ...patch } } : {}
        ),
    }),
    { name: "riprint-user-store" }
  )
);
