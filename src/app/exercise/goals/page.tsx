import { redirect } from "next/navigation";

// Goals merged into the combined Exercises screen.
export default function GoalsPage() {
  redirect("/exercise/manage");
}
