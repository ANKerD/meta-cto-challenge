import { DatabaseSync } from "node:sqlite";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";

type Ticket = { id: number; uuid: string; title: string; status: string; recentVotes: number; totalVotes: number };
type ReportData = { tickets: Ticket[]; unknownVoteTimes: number };

function readData(value: unknown): ReportData | null {
  if (typeof value !== "string") return null;
  try {
    const data: unknown = JSON.parse(value);
    if (typeof data !== "object" || data === null || !("tickets" in data) || !Array.isArray(data.tickets) || !("unknownVoteTimes" in data) || typeof data.unknownVoteTimes !== "number") return null;
    const tickets: Ticket[] = [];
    for (const item of data.tickets) {
      if (typeof item !== "object" || item === null || typeof item.id !== "number" || typeof item.uuid !== "string" || typeof item.title !== "string" || typeof item.status !== "string" || typeof item.recentVotes !== "number" || typeof item.totalVotes !== "number") return null;
      tickets.push({ id: item.id, uuid: item.uuid, title: item.title, status: item.status, recentVotes: item.recentVotes, totalVotes: item.totalVotes });
    }
    return { tickets, unknownVoteTimes: data.unknownVoteTimes };
  } catch {
    return null;
  }
}

function Ranking({ title, tickets, metric }: { title: string; tickets: Ticket[]; metric: "recentVotes" | "totalVotes" }) {
  const ranked = tickets.filter((ticket) => ticket[metric] > 0).sort((a, b) => b[metric] - a[metric] || a.id - b.id).slice(0, 5);
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      {ranked.length ? <ol className="mt-2 divide-y divide-border/60 border-y border-border/60">
        {ranked.map((ticket) => <li key={ticket.uuid} className="flex flex-wrap items-center gap-3 py-2 text-sm">
          <span className="font-mono text-muted">#{ticket.id}</span>
          <Link href={`/requests/${ticket.uuid}`} className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{ticket.title}</Link>
          <StatusChip status={ticket.status} />
          <span className="ml-auto text-muted">Upvotes: <span className="font-mono">{ticket[metric]}</span></span>
        </li>)}
      </ol> : <p className="mt-2 text-sm text-muted">No recorded votes in this period.</p>}
    </section>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  let reports;
  let report;
  try {
    const hasTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'daily_reports'").get();
    reports = hasTable ? db.prepare("SELECT report_date, status FROM daily_reports ORDER BY report_date DESC LIMIT 30").all() : [];
    report = hasTable ? (date ? db.prepare("SELECT * FROM daily_reports WHERE report_date = ?").get(date) : db.prepare("SELECT * FROM daily_reports ORDER BY report_date DESC LIMIT 1").get()) : undefined;
  } finally {
    db.close();
  }
  const data = readData(report?.data);
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 px-6 py-4 text-sm font-medium">Feature requests</header>
      <section className="mx-auto max-w-2xl px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} aria-hidden="true" /> Requests</Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Executive reports</h1>
        {reports.length > 1 && <nav aria-label="Report dates" className="mt-3 flex flex-wrap gap-3 text-sm">{reports.map((item) => <Link key={String(item.report_date)} href={`/reports?date=${encodeURIComponent(String(item.report_date))}`} aria-current={item.report_date === report?.report_date ? "page" : undefined} className="font-mono text-muted hover:text-foreground aria-current:font-semibold aria-current:text-foreground">{String(item.report_date)}</Link>)}</nav>}
        {!report ? <p className="mt-4 text-sm text-muted">No report is available yet. Reports are scheduled daily at 09:00 São Paulo time.</p> : <>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><span className="font-mono">{String(report.report_date)}</span><span className="text-muted">{report.status === "completed" ? "Completed" : report.status === "running" ? "Generating" : "Generation failed"}</span></div>
          {report.status === "completed" && data ? <>
            <p className="mt-3 text-sm text-muted">Window: <time className="font-mono" dateTime={String(report.window_start)}>{String(report.window_start).replace("T", " ").replace(/\.\d+Z$/, " UTC")}</time> to <time className="font-mono" dateTime={String(report.window_end)}>{String(report.window_end).replace("T", " ").replace(/\.\d+Z$/, " UTC")}</time></p>
            <p className="mt-4 whitespace-pre-wrap text-sm">{String(report.summary ?? "")}</p>
            {data.unknownVoteTimes > 0 && <p className="mt-4 text-sm text-muted">{data.unknownVoteTimes} existing votes have no recorded time and are excluded from the 24-hour ranking.</p>}
            <Ranking title="Upvotes in the last 24 hours" tickets={data.tickets} metric="recentVotes" />
            <Ranking title="All-time active upvotes" tickets={data.tickets} metric="totalVotes" />
          </> : <p className="mt-4 text-sm text-muted">{report.status === "running" ? "The report is being generated." : report.status === "failed" ? "The report could not be generated. It will be retried." : "Report data is unavailable."}</p>}
        </>}
      </section>
    </main>
  );
}
