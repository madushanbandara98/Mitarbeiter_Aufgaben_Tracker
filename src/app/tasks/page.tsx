import { AppShell } from "@/components/app-shell";
import { TasksWorkspace } from "@/components/tasks-workspace";
import { requireUser } from "@/lib/auth";
import { getCurrentKW } from "@/lib/date";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requireUser();
  const db = await readDb();
  const currentKw = getCurrentKW();
  const tasks = (user.userType === "admin" ? db.tasks : db.tasks.filter((task) => task.employeeEmail === user.email))
    .sort((left, right) => right.datum.localeCompare(left.datum));
  const weekConfig = db.weekConfigs.find((config) => config.email === user.email && config.kw === currentKw) ?? null;
  const availableUsers = db.users
    .map((entry) => ({
      id: entry.id,
      email: entry.email,
      fullName: entry.fullName,
      abteilung: entry.abteilung,
      userType: entry.userType,
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));

  return (
    <AppShell user={user}>
      <TasksWorkspace
        user={user}
        initialTasks={tasks}
        initialWeekConfig={weekConfig}
        currentKw={currentKw}
        availableUsers={availableUsers}
      />
    </AppShell>
  );
}

