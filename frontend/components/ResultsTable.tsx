import type { QueryResult } from "@/lib/api";

export function ResultsTable({ result }: { result: QueryResult | null }) {
  if (!result) {
    return <div className="p-5 text-sm text-slate-500">Run a query to see results.</div>;
  }

  if (!result.success) {
    return (
      <div className="p-5">
        <div className="mb-2 text-sm font-semibold text-red-300">Query Error</div>
        <div className="rounded border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-100">
          {result.message ?? "The query could not be completed."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <span>{result.rowCount} rows returned in {result.executionTimeMs} ms</span>
        {result.truncated && <span className="text-amber">Displayed results were truncated.</span>}
      </div>
      <div className="max-h-[260px] overflow-auto rounded border border-line">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-[#111c30] text-slate-300">
            <tr>
              {result.columns.map((column) => (
                <th key={column} className="border-b border-line px-3 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-[#0c1626] even:bg-[#101b2d]">
                {row.map((value, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="whitespace-nowrap border-b border-line/70 px-3 py-2 text-slate-300">
                    {value === null ? <span className="text-slate-600">NULL</span> : String(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
