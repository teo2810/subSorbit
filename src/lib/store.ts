import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SEED } from "./seed";
import type { Subscription } from "./types";

export type OrbitSpeed = 0.5 | 1 | 2;

interface AppState {
  subscriptions: Subscription[];
  seenGuide: boolean;
  seenWelcome: boolean;
  displayName: string;
  email: string;
  orbitSpeed: OrbitSpeed;
  addSubscription: (sub: Omit<Subscription, "id">) => string;
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  removeSubscription: (id: string) => void;
  setSeenGuide: (v: boolean) => void;
  setSeenWelcome: (v: boolean) => void;
  setDisplayName: (v: string) => void;
  setEmail: (v: string) => void;
  setOrbitSpeed: (v: OrbitSpeed) => void;
  replaceAll: (subs: Subscription[]) => void;
  clearSubscriptions: () => void;
  resetDemo: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      subscriptions: SEED,
      seenGuide: false,
      seenWelcome: false,
      displayName: "Matteo",
      email: "",
      orbitSpeed: 1,
      addSubscription: (sub) => {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `sub-${Date.now()}`;
        set((s) => ({ subscriptions: [...s.subscriptions, { ...sub, id }] }));
        return id;
      },
      updateSubscription: (id, patch) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((it) =>
            it.id === id ? { ...it, ...patch } : it,
          ),
        })),
      removeSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.filter((it) => it.id !== id),
        })),
      setSeenGuide: (v) => set({ seenGuide: v }),
      setSeenWelcome: (v) => set({ seenWelcome: v }),
      setDisplayName: (v) => set({ displayName: v }),
      setEmail: (v) => set({ email: v }),
      setOrbitSpeed: (v) => set({ orbitSpeed: v }),
      replaceAll: (subs) => set({ subscriptions: subs }),
      clearSubscriptions: () => set({ subscriptions: [] }),
      resetDemo: () =>
        set({
          subscriptions: SEED.map((s) => ({ ...s })),
          seenGuide: false,
          seenWelcome: false,
          displayName: "Matteo",
          email: "",
          orbitSpeed: 1,
        }),
    }),
    {
      name: "orbit-pro-v2",
      storage:
        typeof window === "undefined"
          ? undefined
          : createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        subscriptions: s.subscriptions,
        seenGuide: s.seenGuide,
        seenWelcome: s.seenWelcome,
        displayName: s.displayName,
        email: s.email,
        orbitSpeed: s.orbitSpeed,
      }),
    },
  ),
);
