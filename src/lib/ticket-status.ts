export const ticketStatuses = [
  "open",
  "in_progress",
  "closed",
  "in_review",
  "testing",
  "done",
  "duplicate",
  "archived",
] as const;

export type TicketStatus = (typeof ticketStatuses)[number];
