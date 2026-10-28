import type { ComponentProps } from "react";

const fieldStyle = "w-full rounded-md border border-border/60 bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50";

export function Input(props: Omit<ComponentProps<"input">, "className" | "style">) {
  return <input {...props} className={fieldStyle} />;
}

export function Textarea(props: Omit<ComponentProps<"textarea">, "className" | "style">) {
  return <textarea {...props} className={`${fieldStyle} resize-y`} />;
}

export function Button(props: Omit<ComponentProps<"button">, "className" | "style">) {
  return <button {...props} className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent shadow-sm hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50" />;
}

export function VoteButton(props: Omit<ComponentProps<"button">, "className" | "style">) {
  return <button {...props} className="inline-flex items-center justify-center gap-2 rounded-md border border-vote bg-surface p-2 text-vote hover:bg-vote hover:text-on-vote aria-pressed:bg-vote aria-pressed:text-on-vote aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50" />;
}

export function TextButton(props: Omit<ComponentProps<"button">, "className" | "style">) {
  return <button {...props} className="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />;
}

export function StatusButton(props: Omit<ComponentProps<"button">, "className" | "style">) {
  return <button {...props} className="inline-flex cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-50" />;
}
