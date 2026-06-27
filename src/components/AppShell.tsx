import type { ReactNode } from "react";
import { TabBar } from "./TabBar";

/**
 * The phone column. Fills the viewport on a real device; on a wider screen it
 * floats as a centered, rounded phone frame like the imported design canvas.
 * Content scrolls in the area above the fixed bottom tab bar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center">
      <div className="relative h-[100dvh] w-full max-w-[430px] overflow-hidden bg-surface-sunken text-ink sm:my-6 sm:h-[860px] sm:self-center sm:rounded-phone sm:shadow-phone">
        <div className="no-scrollbar absolute inset-x-0 bottom-[76px] top-0 overflow-y-auto">
          {children}
        </div>
        <TabBar />
      </div>
    </div>
  );
}
