"use client";

import Link from "next/link";
import { Bell, ShieldAlert } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { StatusButton } from "@/components/ui/controls";

export function Notifications({ reports, alerts }: { reports: { date: string; summary: string }[]; alerts: { id: number; actor: string; date: string }[] }) {
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <StatusButton type="button" aria-label={alerts.length ? "Notifications, security alerts present" : "Notifications"}><Bell size={18} className={alerts.length ? "text-close" : undefined} aria-hidden="true" /></StatusButton>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-80 max-w-xs rounded-md border border-border/60 bg-surface p-3 shadow-md">
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        {reports.length === 0 && alerts.length === 0 ? <p className="mt-3 text-sm text-muted">No notifications yet.</p> : <div className="mt-2 max-h-80 overflow-y-auto">
          {alerts.map((alert) => <div key={alert.id} className="mb-2 rounded-md bg-close/10 px-2 py-2 text-sm text-close">
            <span className="flex items-center gap-2 font-semibold"><ShieldAlert size={16} aria-hidden="true" /> Potential prompt injection</span>
            <span className="mt-1 block">Submitted by <strong>{alert.actor}</strong></span>
            <time dateTime={alert.date} className="mt-1 block font-mono text-xs">{alert.date.replace("T", " ").replace(/\.\d+Z$/, " UTC")}</time>
          </div>)}
          {reports.map((report) => <DropdownMenu.Item key={report.date} asChild>
            <Link href={`/reports?date=${encodeURIComponent(report.date)}`} className="block rounded-md px-2 py-2 text-sm outline-none data-highlighted:bg-background">
              <span className="font-medium text-foreground">Executive report</span> <time className="font-mono text-muted">{report.date}</time>
              <span className="mt-1 line-clamp-2 block text-muted">{report.summary}</span>
            </Link>
          </DropdownMenu.Item>)}
        </div>}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
