import type { ReactNode } from "react";
import { TabBar } from "./TabBar";

/**
 * The phone column. Fills the viewport on a real device; on a wider screen it
 * floats as a centered, rounded phone frame like the imported design canvas.
 * Content scrolls in the area above the fixed bottom tab bar.
 */
export function AppShell({
  children,
  showTabBar = true,
}: {
  children: ReactNode;
  /** Sub-flows (add/create/manage/edit) use their own back header, no tab bar. */
  showTabBar?: boolean;
}) {
  return (
    <div className="flex min-h-[100dvh] justify-center">
      <div className="relative h-[100dvh] w-full max-w-[430px] overflow-hidden bg-surface-sunken text-ink sm:my-6 sm:h-[860px] sm:self-center sm:rounded-phone sm:shadow-phone">
        <div
          className={`no-scrollbar absolute inset-x-0 top-0 overflow-y-auto ${
            showTabBar ? "bottom-[76px]" : "bottom-0"
          }`}
        >
          {children}
        </div>
        {showTabBar && <TabBar />}
      </div>
    </div>
  );
}
