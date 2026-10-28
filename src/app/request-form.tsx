"use client";

import { useActionState, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { submitRequest } from "./actions";
import { Button, Input, Textarea, CloseButton } from "@/components/ui/controls";

export function RequestForm() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, action, pending] = useActionState(async (_message: string, data: FormData) => {
    const error = await submitRequest(data);
    if (error) return error;
    setTitle("");
    setDescription("");
    return "Request submitted.";
  }, "");

  return (
    <>
      <Button type="button" onClick={() => dialogRef.current?.showModal()}><Plus size={16} aria-hidden="true" />New request</Button>
      <dialog ref={dialogRef} aria-labelledby="request-dialog-title" onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
      }} className="m-auto w-full max-w-lg rounded-md border border-border/60 bg-surface p-6 text-foreground shadow-sm backdrop:bg-foreground/40">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="request-dialog-title" className="text-lg font-semibold">Submit a feature request</h2>
          <CloseButton type="button" onClick={() => dialogRef.current?.close()}><X size={16} aria-hidden="true" />Close</CloseButton>
        </div>
        <form action={action} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium">Title</label>
                <Input id="title" name="title" placeholder="Search requests by keyword" required disabled={pending} value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium">Description</label>
                <Textarea id="description" name="description" placeholder="What problem would this solve?" required disabled={pending} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              <Button type="submit" disabled={pending}>{pending ? "Submitting..." : "Submit request"}</Button>
              <p role="status" aria-live="polite" className="text-sm text-muted">{message}</p>
        </form>
      </dialog>
    </>
  );
}
