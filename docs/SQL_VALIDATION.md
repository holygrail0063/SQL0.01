# SQLBank Validation Architecture

SQLBank validation has three layers.

## 1. Query Safety

The server accepts only one read-only statement beginning with `SELECT` or `WITH`. Prohibited operations include `DELETE`, `UPDATE`, `INSERT`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `MERGE`, `EXEC`, and related administrative commands.

Safety failures return `success: false` and `errorType: "safety_error"`.

## 2. SQL Execution

The in-memory SQLBank engine uses AlaSQL for the supported SQL subset. Internal normalization is limited to compatibility transformations such as decimal `CAST` handling. Learner-facing syntax remains SQL Server-style.

Double-quoted text literals are rejected with `errorType: "dialect_error"` because SQLBank teaches single-quoted text values.

## Normalized Result Model

Execution produces:

```ts
{
  columns: string[];
  columnDetails: { name: string; normalizedName: string; dataType?: string }[];
  rows: unknown[][];
  rowCount: number;
}
```

Columns are resolved independently of returned rows. For zero-row results, the engine uses the SQL AST plus SQLBank schema metadata to preserve:

- Explicit projections.
- `SELECT *`.
- Qualified stars such as `c.*`.
- Aliases.
- CTE output columns where supported.

## 3. Exercise Evaluation

Exercise evaluation runs only after SQL execution succeeds.

Legacy `comparison_mode` maps to validation contracts:

- `unordered` -> exact multiset rows, ignore row order.
- `ordered` -> exact multiset rows, require row order.
- `single_value` -> scalar comparison.

Column comparison is case-insensitive. Existing SQLBank exercises are strict about requested columns unless a future exercise opts into extra columns.

## Row Comparison

Unordered comparison is duplicate-aware. The result:

```text
A
A
B
```

does not equal:

```text
A
B
```

Numeric values compare with a small tolerance by default. SQL `NULL` is normalized to JavaScript `null`.

## Feedback Types

The API keeps the legacy `message` field and also returns structured `evaluation` details when a graded query executes:

- `correct`
- `missing_columns`
- `extra_columns`
- `wrong_alias`
- `empty_result`
- `wrong_order`
- `wrong_row_count`
- `wrong_rows`
- `aggregation_mismatch`
- `logic_error`

Feedback must describe the actual mismatch. A zero-row result with valid columns should not produce a missing-column message.

## Sandbox

Sandbox queries use only safety and execution. They do not run exercise correctness evaluation.
