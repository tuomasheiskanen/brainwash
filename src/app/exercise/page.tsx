import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ExerciseScreen } from "@/components/ExerciseScreen";

export default function ExercisePage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <ExerciseScreen />
      </Suspense>
    </AppShell>
  );
}
