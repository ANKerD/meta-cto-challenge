import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequestDetails } from "../request-details";

export default async function RequestPage({ params }: { params: Promise<{ uuid: string }> }) {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 px-6 py-4 text-sm font-medium">Feature requests</header>
      <section className="mx-auto max-w-2xl px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <ArrowLeft size={16} aria-hidden="true" /> Feature requests
        </Link>
        <RequestDetails params={params} />
      </section>
    </main>
  );
}
