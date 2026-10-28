import { RequestForm } from "./request-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 px-6 py-4 text-sm font-medium">
        Feature requests
      </header>
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Submit a feature request</h1>
        <p className="mt-2 text-sm text-muted">Describe the feature you need.</p>
        <div className="mt-8 border-t border-border/60 pt-8">
          <RequestForm />
        </div>
      </section>
    </main>
  );
}
