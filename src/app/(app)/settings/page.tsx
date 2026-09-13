import { getNotificationPrefs, getPipelineStageConfig, getTeam } from "@/lib/api";
import { SettingsWorkspace } from "./SettingsWorkspace";

export const metadata = { title: "Settings — Solar Ops" };

export default async function SettingsPage() {
  const [team, stages, prefs] = await Promise.all([
    getTeam(),
    getPipelineStageConfig(),
    getNotificationPrefs(),
  ]);

  return <SettingsWorkspace team={team} stages={stages} prefs={prefs} />;
}
