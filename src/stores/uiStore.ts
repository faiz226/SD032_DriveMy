import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  /**
   * True while a timed exam or quiz is actually in progress.
   *
   * A learner sitting a 45-minute KPP1 mock is doing a different job from a
   * learner browsing the syllabus, and it needs a different shell: AppLayout
   * drops the sidebar, the mobile header and the bottom nav while this is set,
   * so the exam is the only thing on screen and there is no way to wander off
   * mid-attempt. Removing the nav from the DOM (rather than covering it) also
   * keeps it out of the tab order and off the screen reader.
   */
  examMode: boolean;
  setExamMode: (active: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      examMode: false,
      setExamMode: (active) => set({ examMode: active }),
    }),
    {
      name: "drivemy-ui",
      // Only the sidebar preference survives a reload. examMode is ephemeral by
      // design: if it were persisted, a crash or a force-quit during an exam
      // would restore a learner into an app with no navigation and no way out.
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);