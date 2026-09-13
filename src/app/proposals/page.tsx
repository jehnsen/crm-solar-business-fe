import { getInverterCatalog, getPanelCatalog, getProposals } from "@/lib/api";
import { ProposalsWorkspace } from "./ProposalsWorkspace";

export const metadata = { title: "Proposals — Solar Ops" };

export default async function ProposalsPage() {
  const [proposals, panels, inverters] = await Promise.all([
    getProposals(),
    getPanelCatalog(),
    getInverterCatalog(),
  ]);

  return <ProposalsWorkspace proposals={proposals} panels={panels} inverters={inverters} />;
}
