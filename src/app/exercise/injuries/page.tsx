import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { InjuriesScreen } from "@/components/InjuriesScreen";

export default function InjuriesPage() {
  return (
    <AppShell showTabBar={false}>
      <Suspense fallback={null}>
        <InjuriesScreen />
      </Suspense>
    </AppShell>
  );
}
