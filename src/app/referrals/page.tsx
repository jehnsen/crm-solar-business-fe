import { getReferrals, getReferralSummary, getReferrerStandings } from "@/lib/api";
import { ReferralsWorkspace } from "./ReferralsWorkspace";

export const metadata = { title: "Referrals — Solar Ops" };

export default async function ReferralsPage() {
  const [referrals, standings, summary] = await Promise.all([
    getReferrals(),
    getReferrerStandings(),
    getReferralSummary(),
  ]);

  return (
    <ReferralsWorkspace referrals={referrals} standings={standings} summary={summary} />
  );
}
