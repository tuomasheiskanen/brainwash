import { AppShell } from "@/components/AppShell";
import { ExercisesScreen } from "@/components/ExercisesScreen";

export default function ExercisesPage() {
  return (
    <AppShell showTabBar={false}>
      <ExercisesScreen />
    </AppShell>
  );
}
