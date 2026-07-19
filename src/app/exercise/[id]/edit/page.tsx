import { AppShell } from "@/components/AppShell";
import { EditExerciseForm } from "@/components/EditExerciseForm";

export default function EditExercisePage({ params }: { params: { id: string } }) {
  return (
    <AppShell showTabBar={false}>
      <EditExerciseForm id={params.id} />
    </AppShell>
  );
}
