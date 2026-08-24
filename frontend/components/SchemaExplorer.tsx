"use client";

import { ChevronRight, Database } from "lucide-react";
import { useState } from "react";
import type { SchemaTable } from "@/lib/api";

export function SchemaExplorer({ schema }: { schema: SchemaTable[] }) {
  const [openTables, setOpenTables] = useState<Set<string>>(new Set(["Customers"]));

  function toggle(table: string) {
    const next = new Set(openTables);
    if (next.has(table)) {
      next.delete(table);
    } else {
      next.add(table);
    }
    setOpenTables(next);
  }

  return (
    <aside className="h-full border-r border-line bg-panel p-4">
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-700">
        <Database size={16} />
        Database
      </div>
      <div className="mb-4 rounded border border-line bg-elevated px-3 py-2 text-sm text-mint">SQLBankTraining</div>
      <div className="space-y-1">
        {schema.map((table) => {
          const isOpen = openTables.has(table.table);
          return (
            <div key={table.table}>
              <button
                className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm text-slate-950 hover:bg-brand/20"
                onClick={() => toggle(table.table)}
                type="button"
              >
                <ChevronRight className={isOpen ? "rotate-90 transition" : "transition"} size={15} />
                <span>{table.table}</span>
              </button>
              {isOpen && (
                <div className="ml-6 space-y-1 border-l border-line py-1 pl-3">
                  {table.columns.map((column) => (
                    <div key={column.name} className="flex justify-between gap-3 text-xs text-slate-600">
                      <span>{column.name}</span>
                      <span className="shrink-0 text-slate-500">{column.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
