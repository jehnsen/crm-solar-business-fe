import { getCrew, getInstallProjects } from "@/lib/api";
import { InstallsWorkspace } from "./InstallsWorkspace";

export const metadata = { title: "Installations — Solar Ops" };

export default async function InstallationsPage() {
  const [projects, crew] = await Promise.all([getInstallProjects(), getCrew()]);
  return <InstallsWorkspace projects={projects} crew={crew} />;
}
