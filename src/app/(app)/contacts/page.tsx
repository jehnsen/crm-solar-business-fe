import { getContacts, getInstallProjects, getLeads, getServiceTickets } from "@/lib/api";
import { ContactsWorkspace } from "./ContactsWorkspace";

export const metadata = { title: "Contacts — Solar Ops" };

export default async function ContactsPage() {
  const [contacts, leads, projects, tickets] = await Promise.all([
    getContacts(),
    getLeads(),
    getInstallProjects(),
    getServiceTickets(),
  ]);

  // Flatten the joins the table needs so the client component stays presentational.
  const rows = contacts.map((c) => {
    const lead = leads.find((l) => l.contactId === c.id) ?? null;
    const project = projects.find((p) => p.contactId === c.id) ?? null;
    const openTickets = tickets.filter(
      (t) => t.contactId === c.id && t.status !== "resolved" && t.status !== "closed",
    ).length;

    return {
      contact: c,
      stage: lead?.stage ?? null,
      systemSizeKw: project?.systemSizeKw ?? null,
      installStage: project?.stage ?? null,
      openTickets,
      isCustomer: project !== null,
    };
  });

  return <ContactsWorkspace rows={rows} />;
}
