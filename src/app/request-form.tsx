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
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (explanation.trim()) data.set("explanation", explanation);
    if (result?.kind === "related" || result?.kind === "unavailable" || result?.kind === "duplicate_review" || result?.kind === "rejected") {
      data.set("confirmation", result.confirmation);
    }
    startTransition(async () => {
      try {
        const next = await submitRequest(data);
        setResult(next);
        if (next.kind === "created") {
          setTitle("");
          setDescription("");
          setExplanation("");
        }
      } catch {
        setResult({ kind: "error", message: "Could not submit the request. Please try again." });
      }
    });
  }

  const matches = result?.kind === "duplicate_review" || result?.kind === "rejected" || result?.kind === "related" ? result.matches : [];
  const suspected = matches.filter((match) => match.score >= 0.85);
  const related = matches.filter((match) => match.score < 0.85);
  const confirmation = result?.kind === "related" || result?.kind === "unavailable";
  const review = result?.kind === "duplicate_review" || result?.kind === "rejected";

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
            <Input id="title" name="title" placeholder="Search requests by keyword" required disabled={pending} value={title} onChange={(event) => { setTitle(event.target.value); setExplanation(""); setResult(null); }} />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <Textarea id="description" name="description" placeholder="What problem would this solve?" required disabled={pending} rows={3} value={description} onChange={(event) => { setDescription(event.target.value); setExplanation(""); setResult(null); }} />
          </div>
          {review && <p role="status" className="text-sm">These requests may be duplicates. Explain how your request differs before creating it.</p>}
          {result?.kind === "related" && <p role="status" className="text-sm">These tickets may be related. Create this request and link them?</p>}
          {suspected.length > 0 && <div><p className="text-sm font-medium">Possible duplicates</p><ul className="mt-2 space-y-1 text-sm">{suspected.map((match) => <li key={match.uuid}><a href={`/requests/${match.uuid}`} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">{match.title}</a> <span className="font-mono text-muted">{Math.floor(match.score * 1000) / 10}%</span></li>)}</ul></div>}
          {related.length > 0 && <details open={!review}><summary className="cursor-pointer text-sm font-medium">Related requests ({related.length})</summary><p className="mt-2 text-sm text-muted">These requests will be linked if this request is created.</p><ul className="mt-2 space-y-1 text-sm">{related.map((match) => <li key={match.uuid}><a href={`/requests/${match.uuid}`} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">{match.title}</a> <span className="font-mono text-muted">{Math.floor(match.score * 1000) / 10}%</span></li>)}</ul></details>}
          {review && <div className="space-y-2">
            <label htmlFor="explanation" className="block text-sm font-medium">How is this request different?</label>
            <Textarea id="explanation" name="explanation" required disabled={pending} rows={3} value={explanation} onChange={(event) => setExplanation(event.target.value)} />
          </div>}
          {result?.kind === "rejected" && <p role="alert" className="text-sm">{result.reason}</p>}
          {(result?.kind === "error" || result?.kind === "unavailable") && <p role="alert" className="text-sm">{result.message}</p>}
          {result?.kind === "created" && <p role="status" className="text-sm">{result.warning || "Request submitted."}</p>}
          <Button type="submit" disabled={pending}>{pending ? "Checking..." : review ? "Review and create" : confirmation ? "Create request" : "Submit request"}</Button>
        </form>
      </dialog>
    </>
  );
}
