import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { DailyLog } from "@/components/DailyLog";

export default function HomePage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <DailyLog />
      </Suspense>
    </AppShell>
  );
}
