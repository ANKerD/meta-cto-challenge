import { DatabaseSync } from "node:sqlite";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";

export default async function RequestDetails({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  let ticket;
  let related;
  try {
    ticket = db.prepare("SELECT id, title, description, status FROM tickets WHERE uuid = ?").get(uuid);
    if (!ticket) notFound();
    related = db.prepare(`
      SELECT t.uuid, t.id, t.title, t.status
      FROM related_tickets r JOIN tickets t ON t.id = r.related_ticket_id
      WHERE r.ticket_id = ? ORDER BY t.id DESC
    `).all(ticket.id);
  } finally {
    db.close();
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 px-6 py-4 text-sm font-medium">
        Feature requests
      </header>
      <section className="mx-auto max-w-2xl px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <ArrowLeft size={16} aria-hidden="true" /> Feature requests
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-muted">#{String(ticket.id)}</span>
          <h1 className="text-2xl font-semibold tracking-tight">{String(ticket.title)}</h1>
          <StatusChip status={String(ticket.status)} />
        </div>
        <h2 className="mt-6 text-sm font-semibold">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm">{String(ticket.description)}</p>
        <h2 className="mt-6 text-sm font-semibold">Related tickets</h2>
        {related.length ? (
          <ul className="mt-2 divide-y divide-border/60 border-y border-border/60">
            {related.map((item) => (
              <li key={String(item.uuid)} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="font-mono text-muted">#{String(item.id)}</span>
                <Link href={`/requests/${String(item.uuid)}`} className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{String(item.title)}</Link>
                <StatusChip status={String(item.status)} />
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">No related tickets.</p>}
      </section>
    </main>
  );
}
