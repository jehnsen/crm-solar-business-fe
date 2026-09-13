import { getLeads } from "@/lib/api";
import { LeadsWorkspace } from "./LeadsWorkspace";

export const metadata = { title: "Leads — Solar Ops" };

export default async function LeadsPage() {
  const leads = await getLeads();
  return <LeadsWorkspace initialLeads={leads} />;
}
