import { DatabaseSync } from "node:sqlite";
import { archiveDueTickets } from "@/lib/archive";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { VoteButton } from "@/components/ui/controls";
import { SearchControls } from "./search-controls";
import { StatusSelect } from "@/app/requests/status-select";
import { setVote } from "./actions";
import { RequestForm } from "./request-form";
import { searchTickets } from "@/lib/search";

export async function RequestList({ archived = false, query = "" }: { archived?: boolean; query?: string }) {
  archiveDueTickets();
  query = query.trim();
  let search: Awaited<ReturnType<typeof searchTickets>> | null = null;
  let searchError = false;
  if (query) {
    try { search = await searchTickets(query, archived); }
    catch { searchError = true; }
  }
  const username = (await cookies()).get("user")?.value;
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  let tickets;
  try {
    tickets = db.prepare(`
      SELECT t.uuid, t.id, t.title, t.status,
        (SELECT count(*) FROM ticket_votes WHERE ticket_id = t.id) AS votes,
        EXISTS (SELECT 1 FROM ticket_votes WHERE ticket_id = t.id AND username = ?) AS voted
      FROM tickets t WHERE (t.status = 'archived') = ? ORDER BY t.id DESC
    `).all(username ?? "", archived ? 1 : 0);
  } finally {
    db.close();
  }

  if (query) {
    const ranks = new Map(search?.ids.map((id, rank) => [id, rank]) ?? []);
    tickets = tickets.filter((ticket) => ranks.has(Number(ticket.id)))
      .sort((a, b) => (ranks.get(Number(a.id)) ?? 0) - (ranks.get(Number(b.id)) ?? 0));
  }

  const listPath = archived ? "/archived" : "/";
  const detailsQuery = new URLSearchParams();
  if (archived) detailsQuery.set("from", "archived");
  if (query) detailsQuery.set("q", query);
  const detailsSuffix = detailsQuery.size ? `?${detailsQuery}` : "";

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4 text-sm">
        <span className="font-medium">Feature requests</span>
        <span className="flex items-center gap-4 text-muted"><Link href="/reports" className="hover:text-foreground">Reports</Link>{username ? <>Signed in as <strong className="font-semibold text-foreground">{username}</strong></> : "To vote, visit /login?user=your_name."}</span>
      </header>
      <section className="mx-auto max-w-2xl px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{archived ? "Archived requests" : "Feature requests"}</h1>
          <RequestForm />
        </div>
        <SearchControls key={`${listPath}-${query}`} archived={archived} query={query} />
        {searchError && <p role="alert" className="mt-2 text-sm text-muted">Search unavailable. Check Ollama and try again.</p>}
        {search && search.pending > 0 && <p className="mt-2 text-sm text-muted">{search.pending} requests are not indexed yet and are excluded from these results.</p>}
        <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
          {tickets.map((ticket) => (
            <li key={String(ticket.uuid)} className="flex items-center justify-between gap-3 py-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 text-sm">
                <span className="font-mono text-muted">#{String(ticket.id)}</span>
                <Link href={`/requests/${String(ticket.uuid)}${detailsSuffix}`} className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{String(ticket.title)}</Link>
                <StatusSelect key={`${String(ticket.uuid)}-${String(ticket.status)}`} uuid={String(ticket.uuid)} status={String(ticket.status)} />
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
        {!searchError && tickets.length === 0 && <p className="mt-4 text-sm text-muted">{query ? "No indexed requests match." : archived ? "No archived requests." : "No feature requests yet."}</p>}
      </section>
    </main>
  );
}
