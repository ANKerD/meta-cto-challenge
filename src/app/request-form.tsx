"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { submitRequest } from "./actions";
import { Button, Input, Textarea, CloseButton } from "@/components/ui/controls";

type SubmissionResult = Awaited<ReturnType<typeof submitRequest>>;

export function RequestForm() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (result?.kind === "related" || result?.kind === "unavailable") {
      data.set("confirmation", result.confirmation);
    }
    startTransition(async () => {
      try {
        const next = await submitRequest(data);
        setResult(next);
        if (next.kind === "created") {
          setTitle("");
          setDescription("");
        }
      } catch {
        setResult({ kind: "error", message: "Could not submit the request. Please try again." });
      }
    });
  }

  const matches = result?.kind === "duplicate" || result?.kind === "related" ? result.matches : [];
  const confirmation = result?.kind === "related" || result?.kind === "unavailable";

  return (
    <>
      <Button type="button" onClick={() => dialogRef.current?.showModal()}><Plus size={16} aria-hidden="true" />New request</Button>
      <dialog ref={dialogRef} aria-labelledby="request-dialog-title" onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
      }} className="m-auto max-h-full w-full max-w-lg rounded-md border border-border/60 bg-surface p-6 text-foreground shadow-sm backdrop:bg-foreground/40">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="request-dialog-title" className="text-lg font-semibold">Submit a feature request</h2>
          <CloseButton type="button" onClick={() => dialogRef.current?.close()}><X size={16} aria-hidden="true" />Close</CloseButton>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium">Title</label>
            <Input id="title" name="title" placeholder="Search requests by keyword" required disabled={pending} value={title} onChange={(event) => { setTitle(event.target.value); setResult(null); }} />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <Textarea id="description" name="description" placeholder="What problem would this solve?" required disabled={pending} rows={3} value={description} onChange={(event) => { setDescription(event.target.value); setResult(null); }} />
          </div>
          {result?.kind === "duplicate" && <p role="alert" className="text-sm">This request matches an existing ticket. Open the ticket instead.</p>}
          {result?.kind === "related" && <p role="status" className="text-sm">These tickets may be related. Create this request and link them?</p>}
          {matches.length > 0 && <ul className="space-y-1 text-sm">{matches.map((match) => <li key={match.uuid}><a href={`/requests/${match.uuid}`} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">{match.title}</a> <span className="font-mono text-muted">{Math.floor(match.score * 1000) / 10}%</span></li>)}</ul>}
          {(result?.kind === "error" || result?.kind === "unavailable") && <p role="alert" className="text-sm">{result.message}</p>}
          {result?.kind === "created" && <p role="status" className="text-sm">{result.warning || "Request submitted."}</p>}
          <Button type="submit" disabled={pending}>{pending ? "Checking..." : confirmation ? "Create request" : "Submit request"}</Button>
        </form>
      </dialog>
    </>
  );
}
