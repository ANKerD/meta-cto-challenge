"use client";

import { useState, useTransition } from "react";
import { updateStatus } from "@/app/actions";
import { Check } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { StatusButton } from "@/components/ui/controls";
import { StatusChip } from "@/components/ui/status-chip";
import { ticketStatuses } from "@/lib/ticket-status";

export function StatusSelect({ uuid, status }: { uuid: string; status: string }) {
  const [selected, setSelected] = useState(status);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function changeStatus(value: string) {
    setSelected(value);
    setError("");
    startTransition(async () => {
      const data = new FormData();
      data.set("status", value);
      try {
        await updateStatus(uuid, data);
      } catch {
        setSelected(status);
        setError("Could not update status. Try again.");
      }
    });
  }

  return (
    <span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <StatusButton type="button" aria-label={`Change status, ${selected.replaceAll("_", " ")}`} disabled={pending}>
            <StatusChip status={selected} />
          </StatusButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" sideOffset={4} className="z-50 min-w-40 rounded-md border border-border/60 bg-surface p-1 shadow-md">
          {ticketStatuses.map((value) => (
            <DropdownMenu.Item key={value} onSelect={() => changeStatus(value)} className="flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-1 outline-none data-highlighted:bg-background">
              <StatusChip status={value} />
              {value === selected && <Check size={14} aria-hidden="true" className="text-muted" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {error && <span role="alert" className="ml-2 text-sm text-muted">{error}</span>}
    </span>
  );
}
