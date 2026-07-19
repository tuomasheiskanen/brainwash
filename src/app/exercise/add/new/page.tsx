import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { CreateExerciseForm } from "@/components/CreateExerciseForm";

export default function CreateExercisePage() {
  return (
    <AppShell showTabBar={false}>
      <Suspense fallback={null}>
        <CreateExerciseForm />
      </Suspense>
    </AppShell>
  );
}
