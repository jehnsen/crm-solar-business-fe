import { getTasks, getTeam } from "@/lib/api";
import { TasksWorkspace } from "./TasksWorkspace";

export const metadata = { title: "Follow-ups — Solar Ops" };

export default async function TasksPage() {
  const [tasks, team] = await Promise.all([getTasks(), getTeam()]);
  return <TasksWorkspace initialTasks={tasks} team={team} />;
}
