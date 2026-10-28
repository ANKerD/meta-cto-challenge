"use client";

import { useActionState, useState } from "react";
import { submitRequest } from "./actions";
import { Button, Input, Textarea } from "@/components/ui/controls";

export function RequestForm() {
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
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">Title</label>
        <Input id="title" name="title" required disabled={pending} value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <Textarea id="description" name="description" required disabled={pending} rows={6} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Submitting..." : "Submit request"}</Button>
      <p role="status" aria-live="polite" className="text-sm text-muted">{message}</p>
    </form>
  );
}
