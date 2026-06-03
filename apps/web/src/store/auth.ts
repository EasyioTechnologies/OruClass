import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUser } from "@oruclass/types";

interface AuthState {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  setUser: (user: PublicUser | null, isAuthenticated?: boolean) => void;
  clearUser: () => void;
  setSessionExpired: (expired: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isSessionExpired: false,
      setUser: (user, isAuthenticated = true) =>
        set({ user, isAuthenticated: user !== null && isAuthenticated, isSessionExpired: false }),
      clearUser: () =>
        set({ user: null, isAuthenticated: false, isSessionExpired: false }),
      setSessionExpired: (expired) =>
        set((state) => ({
          isSessionExpired: expired,
          isAuthenticated: expired ? false : state.isAuthenticated,
        })),
    }),
    { name: "oruclass-auth" },
  ),
);
