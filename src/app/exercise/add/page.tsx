import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { AddExerciseSearch } from "@/components/AddExerciseSearch";

export default function AddExercisePage() {
  return (
    <AppShell showTabBar={false}>
      <Suspense fallback={null}>
        <AddExerciseSearch />
      </Suspense>
    </AppShell>
  );
}
