export type Challenge = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  starter_sql: string;
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
  errorType?: string;
  message?: string;
};

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    throw new Error(`Could not reach FastAPI at ${API_BASE}. Make sure the backend server is running.`);
  }

  if (!response.ok) {
    throw new Error(`QueryRight API request failed at ${API_BASE}${path} with HTTP ${response.status}.`);
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
    }),
};
