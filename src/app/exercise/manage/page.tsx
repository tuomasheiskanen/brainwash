import { AppShell } from "@/components/AppShell";
import { ManageScreen } from "@/components/ManageScreen";

export default function ManagePage() {
  return (
    <AppShell showTabBar={false}>
      <ManageScreen />
    </AppShell>
  );
}
