"use client";

import { useActionState, useState } from "react";
import { submitRequest } from "./actions";

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
        <input id="title" name="title" required disabled={pending} value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-md bg-white border border-border/60 shadow-sm px-3 py-2 focus:outline-2 focus:outline-offset-2 focus:outline-slate-700" />
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <textarea id="description" name="description" required disabled={pending} rows={6} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-md bg-white border border-border/60 shadow-sm px-3 py-2 focus:outline-2 focus:outline-offset-2 focus:outline-slate-700" />
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending ? "Submitting..." : "Submit request"}</button>
      <p role="status" aria-live="polite" className="text-sm">{message}</p>
    </form>
  );
}
