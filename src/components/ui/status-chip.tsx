import { Check, Circle, CircleCheck, CircleDot, CircleEllipsis, CircleSlash, Copy, FlaskConical } from "lucide-react";
import { ticketStatuses, type TicketStatus } from "@/lib/ticket-status";

const statuses = {
  open: { label: "Open", icon: Circle, color: "text-status-open bg-status-open/10" },
  in_progress: { label: "In progress", icon: CircleDot, color: "text-status-progress bg-status-progress/10" },
  closed: { label: "Closed", icon: CircleSlash, color: "text-status-closed bg-status-closed/10" },
  in_review: { label: "In review", icon: CircleEllipsis, color: "text-status-review bg-status-review/10" },
  testing: { label: "Testing", icon: FlaskConical, color: "text-status-testing bg-status-testing/10" },
  done: { label: "Done", icon: CircleCheck, color: "text-status-done bg-status-done/10" },
  duplicate: { label: "Duplicate", icon: Copy, color: "text-status-duplicate bg-status-duplicate/10" },
} satisfies Record<TicketStatus, { label: string; icon: typeof Check; color: string }>;

export function StatusChip({ status }: { status: string }) {
  const known = ticketStatuses.find((value) => value === status);
  const item = known ? statuses[known] : null;
  const Icon = item?.icon ?? Circle;

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${item?.color ?? "text-muted bg-muted/10"}`}>
      <Icon size={14} aria-hidden="true" />
      {item?.label ?? status.replaceAll("_", " ")}
    </span>
  );
}
