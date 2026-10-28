import { RequestList } from "@/app/request-list";
import { RequestDetails } from "../request-details";
import { RequestModal } from "@/components/ui/request-modal";

export default async function RequestPage({ params, searchParams }: { params: Promise<{ uuid: string }>; searchParams: Promise<{ from?: string }> }) {
  const archived = (await searchParams).from === "archived";
  return <><RequestList archived={archived} /><RequestModal returnTo={archived ? "/archived" : "/"}><RequestDetails params={params} archived={archived} /></RequestModal></>;
}
