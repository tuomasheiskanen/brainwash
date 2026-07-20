import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { AlcoholScreen } from "@/components/AlcoholScreen";

export default function AlcoholPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <AlcoholScreen />
      </Suspense>
    </AppShell>
  );
}
