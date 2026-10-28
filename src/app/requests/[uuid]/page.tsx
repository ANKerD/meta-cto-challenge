import Home from "@/app/page";
import { RequestDetails } from "../request-details";
import { RequestModal } from "@/components/ui/request-modal";

export default function RequestPage({ params }: { params: Promise<{ uuid: string }> }) {
  return <><Home /><RequestModal><RequestDetails params={params} /></RequestModal></>;
}
