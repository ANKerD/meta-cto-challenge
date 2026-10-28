export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
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
