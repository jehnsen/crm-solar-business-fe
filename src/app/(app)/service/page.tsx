import { getServiceTickets, getWarranties } from "@/lib/api";
import { ServiceWorkspace } from "./ServiceWorkspace";

export const metadata = { title: "Service & Warranty — Solar Ops" };

export default async function ServicePage() {
  const [tickets, warranties] = await Promise.all([getServiceTickets(), getWarranties()]);
  return <ServiceWorkspace tickets={tickets} warranties={warranties} />;
}
