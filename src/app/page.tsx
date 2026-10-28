import { RequestList } from "./request-list";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <RequestList query={typeof q === "string" ? q : ""} />;
}
