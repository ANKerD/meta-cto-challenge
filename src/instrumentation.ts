export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { archiveDueTickets } = await import("./lib/archive");
  archiveDueTickets();
  setInterval(() => {
    try { archiveDueTickets(); } catch (error) { console.error("Automatic archiving failed", error); }
  }, 60_000).unref();
}
