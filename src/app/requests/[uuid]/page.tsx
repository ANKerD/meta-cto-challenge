import { RequestList } from "@/app/request-list";
import { RequestDetails } from "../request-details";
import { RequestModal } from "@/components/ui/request-modal";

export default async function RequestPage({ params, searchParams }: { params: Promise<{ uuid: string }>; searchParams: Promise<{ from?: string; q?: string }> }) {
  const search = await searchParams;
  const archived = search.from === "archived";
  const query = typeof search.q === "string" ? search.q : "";
  const returnTo = `${archived ? "/archived" : "/"}${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  return <><RequestList archived={archived} query={query} /><RequestModal returnTo={returnTo}><RequestDetails params={params} archived={archived} query={query} /></RequestModal></>;
}
