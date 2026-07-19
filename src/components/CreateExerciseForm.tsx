"use client";

import { useSearchParams } from "next/navigation";
import { ExerciseForm } from "./ExerciseForm";

/** Create flow: prefills the name from ?name= (the "Create X" search action). */
export function CreateExerciseForm() {
  const initialName = useSearchParams().get("name") ?? "";
  return <ExerciseForm mode="create" initialName={initialName} />;
}
