import { getPermitProjects } from "@/lib/api";
import { PermittingWorkspace } from "./PermittingWorkspace";

export const metadata = { title: "Permitting & Interconnection — Solar Ops" };

export default async function PermittingPage() {
  const projects = await getPermitProjects();
  return <PermittingWorkspace projects={projects} />;
}
