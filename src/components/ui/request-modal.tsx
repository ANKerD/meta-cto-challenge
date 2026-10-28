"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { TextButton } from "./controls";

export function RequestModal({ children, returnTo }: { children: ReactNode; returnTo: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog ref={ref} aria-label="Feature request details" onCancel={(event) => { event.preventDefault(); router.push(returnTo); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) router.push(returnTo);
    }} className="m-auto max-h-full w-full max-w-lg rounded-md border border-border/60 bg-surface p-6 text-foreground shadow-sm backdrop:bg-foreground/40">
      <div className="float-right ml-3"><TextButton type="button" onClick={() => router.push(returnTo)}><X size={16} aria-hidden="true" />Close</TextButton></div>
      {children}
    </dialog>
  );
}
