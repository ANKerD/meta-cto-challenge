import { Button, Input } from "@/components/ui/controls";
import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return <main className="min-h-screen bg-background">
    <header className="border-b border-border/60 px-6 py-4 text-sm font-medium">Feature requests</header>
    <section className="mx-auto max-w-sm px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <form action={login.bind(null, typeof next === "string" ? next : "/")} className="mt-4 space-y-3">
        <label htmlFor="user" className="block text-sm font-medium">Username</label>
        <Input id="user" name="user" placeholder="Enter your username" autoComplete="username" required maxLength={100} />
        {error && <p role="alert" className="text-sm text-close">Enter a username of up to 100 characters.</p>}
        <Button type="submit">Sign in</Button>
      </form>
    </section>
  </main>;
}
