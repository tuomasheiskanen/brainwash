"use client";

import { useSearchParams } from "next/navigation";
import { ExerciseForm } from "./ExerciseForm";

/** Create flow: prefills the name from ?name= (the "Create X" search action). */
export function CreateExerciseForm() {
  const params = useSearchParams();
  const initialName = params.get("name") ?? "";
  const fromManage = params.get("from") === "manage";
  return (
    <ExerciseForm
      mode="create"
      initialName={initialName}
      createBackHref={fromManage ? "/exercise/add?from=manage" : "/exercise/add"}
      createDoneHref={fromManage ? "/exercise/manage" : "/exercise"}
    />
  );
}
