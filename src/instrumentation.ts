export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { DatabaseSync } = await import("node:sqlite");
  const { initializeReports, dueReportDate, generateReport } = await import("./lib/daily-reports");
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  try { initializeReports(db); } finally { db.close(); }
  const cron = await import("node-cron");
  const runReport = () => {
    if (dueReportDate()) generateReport().catch((error) => console.error("Daily report failed; will retry", error));
  };
  cron.schedule("0 9 * * *", runReport, { timezone: "America/Sao_Paulo", noOverlap: true, unref: true });
  cron.schedule("*/5 * * * *", runReport, { timezone: "America/Sao_Paulo", noOverlap: true, unref: true });
  runReport();
  const { archiveDueTickets } = await import("./lib/archive");
  archiveDueTickets();
  const { processIndexQueue } = await import("./lib/index-queue");
  const processQueue = () => { processIndexQueue().catch((error) => console.error("Indexing failed; will retry", error)); };
  processQueue();
  setInterval(processQueue, 10_000).unref();
  setInterval(() => {
    try { archiveDueTickets(); } catch (error) { console.error("Automatic archiving failed", error); }
  }, 60_000).unref();
}
