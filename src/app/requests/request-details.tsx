import { DatabaseSync } from "node:sqlite";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusChip } from "@/components/ui/status-chip";
import { StatusSelect } from "./status-select";

export async function RequestDetails({ params, archived = false }: { params: Promise<{ uuid: string }>; archived?: boolean }) {
  const { uuid } = await params;
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  let ticket;
  let related;
  let history;
  try {
    ticket = db.prepare("SELECT id, title, description, status FROM tickets WHERE uuid = ?").get(uuid);
    if (!ticket) notFound();
    related = db.prepare(`
      SELECT t.uuid, t.id, t.title, t.status
      FROM related_tickets r JOIN tickets t ON t.id = r.related_ticket_id
      WHERE r.ticket_id = ? ORDER BY t.id DESC
    `).all(ticket.id);
    history = db.prepare(`
      SELECT u.id, u.created_at, u.actor, change.key AS field,
        json_extract(change.value, '$.old') AS old_value,
        json_extract(change.value, '$.new') AS new_value
      FROM ticket_updates u, json_each(u.changes) AS change
      WHERE u.ticket_id = ? ORDER BY u.id DESC
    `).all(ticket.id);
  } finally {
    db.close();
  }

  return (
    <>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-muted">#{String(ticket.id)}</span>
          <h1 className="text-2xl font-semibold tracking-tight">{String(ticket.title)}</h1>
          <StatusSelect key={`${uuid}-${String(ticket.status)}`} uuid={uuid} status={String(ticket.status)} />
        </div>
        <h2 className="mt-6 text-sm font-semibold">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm">{String(ticket.description)}</p>
        <h2 className="mt-6 text-sm font-semibold">Related tickets</h2>
        {related.length ? (
          <ul className="mt-2 divide-y divide-border/60 border-y border-border/60">
            {related.map((item) => (
              <li key={String(item.uuid)} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="font-mono text-muted">#{String(item.id)}</span>
                <Link href={`/requests/${String(item.uuid)}${archived ? "?from=archived" : ""}`} className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{String(item.title)}</Link>
                <StatusChip status={String(item.status)} />
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">No related tickets.</p>}
        <h2 className="mt-6 text-sm font-semibold">Update history</h2>
        {history.length ? (
          <ul className="mt-2 divide-y divide-border/60 border-y border-border/60">
            {history.map((entry) => (
              <li key={`${String(entry.id)}-${String(entry.field)}`} className="flex flex-wrap items-center gap-x-2 py-2 text-sm">
                <time className="font-mono text-xs text-muted" dateTime={String(entry.created_at)}>{String(entry.created_at).replace("T", " ").replace(/\.\d+Z$/, " UTC")}</time>
                <span>{entry.actor === null ? "Unknown user" : String(entry.actor)}</span>
                <span>{String(entry.field).replaceAll("_", " ")}: {entry.old_value === null ? "None" : String(entry.old_value).replaceAll("_", " ")} → {entry.new_value === null ? "None" : String(entry.new_value).replaceAll("_", " ")}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">No updates yet.</p>}
    </>
  );
}

