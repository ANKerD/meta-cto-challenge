import { DatabaseSync } from "node:sqlite";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { VoteButton } from "@/components/ui/controls";
import { StatusChip } from "@/components/ui/status-chip";
import { setVote } from "./actions";
import { RequestForm } from "./request-form";

export default async function Home() {
  const username = (await cookies()).get("user")?.value;
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  let tickets;
  try {
    tickets = db.prepare(`
      SELECT t.uuid, t.id, t.title, t.status,
        (SELECT count(*) FROM ticket_votes WHERE ticket_id = t.id) AS votes,
        EXISTS (SELECT 1 FROM ticket_votes WHERE ticket_id = t.id AND username = ?) AS voted
      FROM tickets t ORDER BY t.id DESC
    `).all(username ?? "");
  } finally {
    db.close();
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 px-6 py-4 text-sm font-medium">
        Feature requests
      </header>
      <section className="mx-auto max-w-2xl px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Feature requests</h1>
          <RequestForm />
        </div>
        <p className="mt-2 text-sm text-muted">{username ? `Signed in as ${username}` : "To vote, visit /login?user=your_name."}</p>
        <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
          {tickets.map((ticket) => (
            <li key={String(ticket.uuid)} className="flex items-center justify-between gap-3 py-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 text-sm">
                <span className="font-mono text-muted">#{String(ticket.id)}</span>
                <Link href={`/requests/${String(ticket.uuid)}`} className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{String(ticket.title)}</Link>
                <StatusChip status={String(ticket.status)} />
              </div>
              <form className="flex items-center gap-2" action={setVote.bind(null, String(ticket.uuid), ticket.voted ? "remove" : "add")}>
                <span className="rounded-md bg-surface px-2 py-1 text-sm text-muted">Upvotes: <span className="font-mono">{String(ticket.votes)}</span></span>
                <VoteButton type="submit" disabled={!username} aria-pressed={Boolean(ticket.voted)} aria-label={ticket.voted ? "Remove upvote" : "Upvote"}>
                  <ArrowUp size={16} aria-hidden="true" />
                </VoteButton>
              </form>
            </li>
          ))}
        </ul>
        {tickets.length === 0 && <p className="mt-4 text-sm text-muted">No feature requests yet.</p>}
      </section>
    </main>
  );
}
