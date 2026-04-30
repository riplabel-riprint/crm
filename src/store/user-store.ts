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
    }),
    { name: "riprint-user-store" }
  )
);
