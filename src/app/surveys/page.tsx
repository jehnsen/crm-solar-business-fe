import { getSurveys } from "@/lib/api";
import { SurveysWorkspace } from "./SurveysWorkspace";

export const metadata = { title: "Site Surveys — Solar Ops" };

export default async function SurveysPage() {
  const surveys = await getSurveys();
  return <SurveysWorkspace surveys={surveys} />;
}
