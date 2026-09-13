import { getContracts } from "@/lib/api";
import { ContractsWorkspace } from "./ContractsWorkspace";

export const metadata = { title: "Contracts — Solar Ops" };

export default async function ContractsPage() {
  const contracts = await getContracts();
  return <ContractsWorkspace contracts={contracts} />;
}
