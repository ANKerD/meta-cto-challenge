import { RequestList } from "@/app/request-list";

export default async function ArchivedPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <RequestList archived query={typeof q === "string" ? q : ""} />;
}
