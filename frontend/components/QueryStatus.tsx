import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import type { QueryResult } from "@/lib/api";

export function QueryStatus({ result }: { result: QueryResult | null }) {
  if (!result) {
    return <span className="flex items-center gap-2 text-sm text-slate-500"><Circle size={15} /> Ready</span>;
  }
  if (!result.success) {
    return <span className="flex items-center gap-2 text-sm text-red-300"><AlertTriangle size={16} /> {result.errorType === "validation_error" ? "Rejected" : "SQL error"}</span>;
  }
  if (result.correct) {
    return <span className="flex items-center gap-2 text-sm text-success"><CheckCircle2 size={16} /> Correct</span>;
  }
  return <span className="flex items-center gap-2 text-sm text-amber"><AlertTriangle size={16} /> Not quite</span>;
}
