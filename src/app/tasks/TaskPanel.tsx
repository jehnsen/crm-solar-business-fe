"use client";

import Link from "next/link";
import { Check, Clock, MapPin, Phone } from "lucide-react";
import { contactOf, member } from "@/lib/lookups";
import { TASK_KIND, TASK_PRIORITY, TASK_STATUS, TASK_TRIGGER } from "@/lib/labels";
import { TODAY, date, dayCount, daysBetween, relativeDays } from "@/lib/format";
import type { Task, TaskStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, FieldList, PanelSection, SlideOver } from "@/components/ui/SlideOver";
import { AlertLine, PersonCell } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

const SETTABLE: TaskStatus[] = ["open", "in-progress", "snoozed", "canceled"];

export function TaskPanel({
  task,
  onClose,
  onComplete,
  onStatus,
}: {
  task: Task | null;
  onClose: () => void;
  onComplete: () => void;
  onStatus: (status: TaskStatus) => void;
}) {
  if (!task) return null;

  const contact = contactOf(task.contactId);
  const assignee = member(task.assigneeId);
  const live = task.status === "open" || task.status === "in-progress";
  const overdue = live && new Date(task.dueAt).getTime() < TODAY.getTime();

  return (
    <SlideOver
      open={Boolean(task)}
      onClose={onClose}
      title={task.title}
      subtitle={
        <>
          <StatusBadge spec={TASK_STATUS[task.status]} dot />
          <StatusBadge spec={TASK_PRIORITY[task.priority]} size="sm" />
          <span className="text-tiny text-muted">{TASK_KIND[task.kind]}</span>
        </>
      }
      footer={
        <>
          {live && (
            <Button variant="primary" onClick={onComplete}>
              <Check className="size-4" strokeWidth={2.5} />
              Mark done
            </Button>
          )}
          <Link
            href={`/contacts/${task.contactId}`}
            className="ml-auto text-tiny font-medium text-solar-hot hover:underline"
          >
            Full customer record
          </Link>
        </>
      }
    >
      {overdue && (
        <div className="mb-5">
          <AlertLine tone="danger" icon={Clock}>
            Past due by {dayCount(daysBetween(task.dueAt))}. It was set for {date(task.dueAt)}.
          </AlertLine>
        </div>
      )}

      {task.status === "snoozed" && task.snoozedUntil && (
        <div className="mb-5">
          <AlertLine tone="idle" icon={Clock}>
            Snoozed until {date(task.snoozedUntil)} — it comes back into the queue then.
          </AlertLine>
        </div>
      )}

      {task.detail && (
        <PanelSection title="Detail">
          <p className="rounded border border-rule bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
            {task.detail}
          </p>
        </PanelSection>
      )}

      <PanelSection title="Customer">
        <div className="space-y-2 rounded border border-rule bg-surface px-3 py-2.5">
          <p className="text-sm font-medium text-ink">{contact?.name}</p>
          {contact && (
            <>
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <Phone className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
                <a href={`tel:${contact.phone}`} className="tnum hover:underline">
                  {contact.phone}
                </a>
              </p>
              <p className="flex items-start gap-2 text-sm text-ink-soft">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted" strokeWidth={2} />
                {contact.address.city}, {contact.address.state}
              </p>
            </>
          )}
        </div>
      </PanelSection>

      <PanelSection title="Details">
        <FieldList>
          <Field label="Owner">
            {assignee ? (
              <PersonCell name={assignee.name} initials={assignee.initials} meta={assignee.team} />
            ) : (
              "Unassigned"
            )}
          </Field>
          <Field label="Kind">{TASK_KIND[task.kind]}</Field>
          <Field label="Why it exists">{TASK_TRIGGER[task.trigger]}</Field>
          <Field label="Created" numeric>
            {date(task.createdAt)}
          </Field>
          <Field label="Due" numeric>
            {date(task.dueAt)} ({relativeDays(task.dueAt)})
          </Field>
          {task.completedAt && (
            <Field label="Completed" numeric>
              {date(task.completedAt)}
            </Field>
          )}
          {task.leadId && <Field label="Lead">{task.leadId}</Field>}
          {task.projectId && <Field label="Install">{task.projectId}</Field>}
        </FieldList>
      </PanelSection>

      <PanelSection title="Set status">
        <div className="flex flex-wrap gap-1.5">
          {SETTABLE.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatus(status)}
              disabled={status === task.status}
              className="rounded border border-rule-firm bg-surface px-2.5 py-1 text-tiny font-medium text-ink-soft transition-colors hover:bg-canvas-sunk disabled:border-solar disabled:bg-solar-wash disabled:text-solar-hot"
            >
              {TASK_STATUS[status].label}
            </button>
          ))}
        </div>
      </PanelSection>
    </SlideOver>
  );
}
