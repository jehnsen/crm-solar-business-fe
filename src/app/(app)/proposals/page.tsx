import {
  getContacts,
  getInverterCatalog,
  getPanelCatalog,
  getPricingConstants,
  getProposals,
} from "@/lib/api";
import { ProposalsWorkspace } from "./ProposalsWorkspace";

export const metadata = { title: "Proposals — Solar Ops" };

export default async function ProposalsPage() {
  const [proposals, panels, inverters, contacts, pricing] = await Promise.all([
    getProposals(),
    getPanelCatalog(),
    getInverterCatalog(),
    getContacts(),
    getPricingConstants(),
  ]);

  return (
    <ProposalsWorkspace
      proposals={proposals}
      panels={panels}
      inverters={inverters}
      contacts={contacts}
      pricing={pricing}
    />
  );
}
