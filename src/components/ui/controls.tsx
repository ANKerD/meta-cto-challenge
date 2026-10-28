import type { ComponentProps } from "react";
import { Search, X } from "lucide-react";

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

export function CloseButton(props: Omit<ComponentProps<"button">, "className" | "style">) {
  return <button {...props} className="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-close hover:bg-close/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-close" />;
}

export function StatusButton(props: Omit<ComponentProps<"button">, "className" | "style">) {
  return <button {...props} className="inline-flex cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-50" />;
}

export function ArchiveToggle({ checked, ...props }: Omit<ComponentProps<"button">, "className" | "style"> & { checked: boolean }) {
  return <button {...props} role="switch" aria-checked={checked} className="group inline-flex items-center gap-2 rounded-md text-sm text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><span aria-hidden="true" className="flex h-5 w-9 items-center rounded-full bg-border/60 p-1 group-aria-checked:bg-accent"><span className="h-3 w-3 rounded-full bg-surface shadow-sm group-aria-checked:translate-x-4" /></span>Show archived</button>;
}

export function SearchField({ value, onChange, onClear }: { value: string; onChange: (value: string) => void; onClear: () => void }) {
  return (
    <div className="relative w-full">
      <input id="request-search" name="q" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search requests" className="w-full rounded-md border border-border/60 bg-surface py-2 pl-10 pr-10 text-sm text-foreground shadow-sm outline-none placeholder:text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30" />
      <button type="submit" aria-label="Search" className="absolute inset-y-0 left-0 inline-flex items-center px-3 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Search size={16} aria-hidden="true" /></button>
      {value && <button type="button" onClick={onClear} aria-label="Clear search" className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><X size={16} aria-hidden="true" /></button>}
    </div>
  );
}
