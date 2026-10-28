"use client";

import { useState, useTransition } from "react";
import { updateStatus } from "@/app/actions";
import { ChevronDown } from "lucide-react";
import { StatusDropdown } from "@/components/ui/controls";
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
      <span className="relative inline-flex items-center rounded-md focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
        <StatusChip status={selected} />
        <ChevronDown size={14} aria-hidden="true" className="text-muted" />
        <StatusDropdown aria-label="Change status" value={selected} disabled={pending} onChange={(event) => changeStatus(event.target.value)}>
          {ticketStatuses.map((value) => {
            const label = value.replaceAll("_", " ");
            return <option key={value} value={value}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
          })}
        </StatusDropdown>
      </span>
      {error && <span role="alert" className="ml-2 text-sm text-muted">{error}</span>}
    </span>
  );
}
