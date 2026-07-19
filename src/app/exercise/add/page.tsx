import { AppShell } from "@/components/AppShell";
import { AddExerciseSearch } from "@/components/AddExerciseSearch";

export default function AddExercisePage() {
  return (
    <AppShell showTabBar={false}>
      <AddExerciseSearch />
    </AppShell>
  );
}
