import { supabase } from "@/lib/supabase";

export type Challenge = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  starter_sql: string;
  concept: string;
  lesson: string;
  example_sql: string;
  success_criteria: string[];
  guidance: Record<string, string>;
};

export type SchemaColumn = {
  name: string;
  type: string;
};

export type SchemaTable = {
  table: string;
  columns: SchemaColumn[];
};

export type QueryResult = {
  success: boolean;
  correct: boolean;
  columns: string[];
  rows: (string | number | null)[][];
  executionTimeMs: number;
  truncated: boolean;
  rowCount: number;
  displayedRowCount?: number;
  errorType?: string;
  message?: string;
  evaluation?: {
    correct: boolean;
    type: string;
    message: string | null;
    details?: Record<string, unknown>;
  };
};

export class QueryRightApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "QueryRightApiError";
    this.status = status;
    this.code = code;
  }
}

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type ApiRequestInit = RequestInit & { auth?: boolean };

async function request<T>(path: string, options?: ApiRequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  if (options?.auth) {
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token;
    if (!token) throw new Error("Please log in before using QueryRight.");
    headers.set("Authorization", `Bearer ${token}`);
  }

  const { auth: _auth, ...fetchOptions } = options ?? {};
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
    });
  } catch {
    throw new Error(`Could not reach the QueryRight API${API_BASE ? ` at ${API_BASE}` : ""}.`);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: unknown; message?: unknown; code?: unknown } | null;
    const code = typeof payload?.code === "string" ? payload.code : undefined;
    const message = typeof payload?.error === "string"
      ? payload.error
      : typeof payload?.message === "string"
        ? payload.message
        : `QueryRight API request failed at ${API_BASE}${path} with HTTP ${response.status}.`;
    throw new QueryRightApiError(message, response.status, code);
  }

  return response.json() as Promise<T>;
}

export const api = {
  challenges: () => request<Challenge[]>("/api/challenges"),
  schema: () => request<SchemaTable[]>("/api/schema"),
  runQuery: (challengeId: number, query: string) =>
    request<QueryResult>("/api/query/run", {
      method: "POST",
      body: JSON.stringify({ challengeId, query }),
      auth: true,
    }),
  runFreeQuery: (query: string) =>
    request<QueryResult>("/api/query/free", {
      method: "POST",
      body: JSON.stringify({ query }),
      auth: true,
    }),
};
