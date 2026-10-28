import { RequestDetails } from "@/app/requests/request-details";
import { RequestModal } from "@/components/ui/request-modal";

export default function Page({ params }: { params: Promise<{ uuid: string }> }) {
  return <RequestModal><RequestDetails params={params} /></RequestModal>;
}
