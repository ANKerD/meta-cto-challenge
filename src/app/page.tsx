import { RequestForm } from "./request-form";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Submit a feature request</h1>
      <p className="mb-8 text-sm text-slate-600">Describe the feature you need.</p>
      <RequestForm />
    </main>
  );
}
