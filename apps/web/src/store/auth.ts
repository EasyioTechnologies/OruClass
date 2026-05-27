import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUser } from "@oruclass/types";

interface AuthState {
  user: PublicUser | null;
  isAuthenticated: boolean;
  setUser: (user: PublicUser | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: user !== null }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "oruclass-auth" },
  ),
);
