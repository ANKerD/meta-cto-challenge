"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveToggle, SearchField } from "@/components/ui/controls";

export function SearchControls({ archived, query }: { archived: boolean; query: string }) {
  const [value, setValue] = useState(query);
  const router = useRouter();
  const path = archived ? "/archived" : "/";

  function clear() {
    setValue("");
    if (query) router.push(path);
  }

  function toggleArchived() {
    const destination = archived ? "/" : "/archived";
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`${destination}${params.size ? `?${params}` : ""}`);
  }

  return (
    <div className="mt-4 space-y-3">
      <ArchiveToggle type="button" checked={archived} onClick={toggleArchived} />
      <form action={path}>
        <label htmlFor="request-search" className="sr-only">Search requests</label>
        <SearchField value={value} onChange={setValue} onClear={clear} />
      </form>
    </div>
  );
}
