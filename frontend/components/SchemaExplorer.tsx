"use client";

import { ChevronRight, Database, KeyRound, Search, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { SchemaTable } from "@/lib/api";

export function SchemaExplorer({ className = "h-full border-r border-line bg-panel p-4", schema }: { schema: SchemaTable[]; className?: string }) {
  const [openTables, setOpenTables] = useState<Set<string>>(new Set(["Customers"]));
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredSchema = useMemo(() => {
    if (!normalizedSearch) return schema;
    return schema
      .map((table) => {
        const tableMatches = table.table.toLowerCase().includes(normalizedSearch);
        const columns = table.columns.filter((column) => tableMatches || column.name.toLowerCase().includes(normalizedSearch));
        return tableMatches || columns.length ? { ...table, columns } : null;
      })
      .filter((table): table is SchemaTable => Boolean(table));
  }, [normalizedSearch, schema]);

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
    <aside className={className}>
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
        <Database size={16} />
        Database
      </div>
      <div className="mb-4 rounded border border-line bg-elevated px-3 py-2 text-sm text-mint">SQLBankTraining</div>
      <label className="mb-3 flex items-center gap-2 rounded border border-line bg-ink px-3 py-2 text-sm text-slate-300 focus-within:border-brand/50">
        <Search size={15} className="text-slate-500" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tables & columns"
          type="search"
          value={search}
        />
      </label>
      <div className="space-y-1">
        {filteredSchema.map((table) => {
          const isOpen = normalizedSearch ? true : openTables.has(table.table);
          return (
            <div key={table.table}>
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-50 hover:bg-brand/20"
                onClick={() => toggle(table.table)}
                type="button"
              >
                <ChevronRight className={isOpen ? "rotate-90 transition" : "transition"} size={15} />
                <Table2 size={15} className="text-cyan" />
                <span className="flex-1">{table.table}</span>
                <span className="text-xs text-slate-500">{table.columns.length}</span>
              </button>
              {isOpen && (
                <div className="ml-6 space-y-1 border-l border-line py-1 pl-3">
                  {table.columns.map((column, index) => (
                    <div key={column.name} className="flex justify-between gap-3 text-xs text-slate-400">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        {index === 0 ? <KeyRound size={11} className="shrink-0 text-brand" /> : <span className="h-2.5 w-[11px] shrink-0" />}
                        <span className={matchesSearch(column.name, normalizedSearch) ? "text-brand" : ""}>{column.name}</span>
                      </span>
                      <span className="shrink-0 text-slate-500">{column.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!filteredSchema.length && <div className="rounded border border-line p-3 text-sm text-slate-500">No schema matches.</div>}
      </div>
    </aside>
  );
}

function matchesSearch(value: string, search: string) {
  return Boolean(search && value.toLowerCase().includes(search));
}
