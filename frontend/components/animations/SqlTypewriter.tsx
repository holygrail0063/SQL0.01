"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Phase = "typing" | "waiting" | "results" | "holding" | "erasing";

type DemoQuery = {
  query: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  durationMs: number;
};

const demos: DemoQuery[] = [
  {
    query: `SELECT c.first_name, c.province, COUNT(l.id) AS loans
FROM Customers c
LEFT JOIN Loans l ON l.customer_id = c.id
GROUP BY c.first_name, c.province
ORDER BY loans DESC
LIMIT 5;`,
    columns: ["first_name", "province", "loans"],
    rows: [
      ["Priya", "Ontario", 9],
      ["Marcus", "Quebec", 7],
      ["Isabelle", "Ontario", 6],
      ["Ravi", "Alberta", 5],
      ["Chen", "BC", 5],
    ],
    durationMs: 42,
  },
  {
    query: `WITH OntarioCustomers AS (
  SELECT * FROM Customers WHERE province = 'Ontario'
)
SELECT COUNT(*) AS ontario_total FROM OntarioCustomers;`,
    columns: ["ontario_total"],
    rows: [[148]],
    durationMs: 18,
  },
  {
    query: `SELECT branch_id, SUM(amount) AS total_paid
FROM Payments
WHERE paid_at >= DATE '2025-01-01'
GROUP BY branch_id
ORDER BY total_paid DESC;`,
    columns: ["branch_id", "total_paid"],
    rows: [
      ["BR-04", "$1,284,910"],
      ["BR-11", "$988,204"],
      ["BR-02", "$742,110"],
      ["BR-17", "$611,050"],
    ],
    durationMs: 31,
  },
];

const keywordPattern = /^(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|LIMIT|WITH|AS|AND|OR|COUNT|SUM|AVG|DATE|DESC|ASC)$/i;

export function SqlTypewriter() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useElementInView(containerRef);
  const [demoIndex, setDemoIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const demo = demos[demoIndex];
  const visibleSql = demo.query.slice(0, visibleCount);
  const showResults = phase === "results" || phase === "holding" || Boolean(reducedMotion);
  const shouldAnimate = Boolean(!reducedMotion && isInView);

  useEffect(() => {
    if (!reducedMotion) return;
    setDemoIndex(0);
    setVisibleCount(demos[0].query.length);
    setPhase("results");
  }, [reducedMotion]);

  useEffect(() => {
    if (!shouldAnimate) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (phase === "typing") {
      if (visibleCount < demo.query.length) {
        timeout = setTimeout(() => setVisibleCount((count) => count + 1), 26);
      } else {
        setPhase("waiting");
      }
    }

    if (phase === "waiting") {
      timeout = setTimeout(() => setPhase("results"), 400);
    }

    if (phase === "results") {
      timeout = setTimeout(() => setPhase("holding"), 400 + demo.rows.length * 50 + 260);
    }

    if (phase === "holding") {
      timeout = setTimeout(() => setPhase("erasing"), 2600);
    }

    if (phase === "erasing") {
      if (visibleCount > 0) {
        timeout = setTimeout(() => setVisibleCount((count) => Math.max(0, count - 1)), 10);
      } else {
        setDemoIndex((index) => (index + 1) % demos.length);
        setPhase("typing");
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [demo.query.length, demo.rows.length, phase, shouldAnimate, visibleCount]);

  const rowLabel = `${demo.rows.length} ${demo.rows.length === 1 ? "ROW" : "ROWS"}`;

  return (
    <motion.div
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      aria-label="Animated demonstration of SQL being written and returning results in QueryRight."
      className="overflow-hidden rounded-2xl border border-line bg-panel/90 shadow-2xl shadow-black/40 backdrop-blur"
      data-testid="sql-typewriter"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.98 }}
      ref={containerRef}
      transition={{ delay: reducedMotion ? 0 : 0.3, duration: reducedMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3" data-testid="sql-typewriter-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
          </div>
          <span className="truncate font-mono text-xs text-slate-500">sqlbank_training.sql</span>
        </div>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-brand">Challenge 07</span>
      </div>

      <div className="bg-editor">
        <pre
          aria-hidden="true"
          className="min-h-[250px] whitespace-pre-wrap px-4 py-5 font-mono text-[11px] leading-[1.6] text-slate-300 sm:px-6 sm:text-[13px]"
          data-testid="sql-typewriter-query"
        >
          <HighlightedSql sql={visibleSql} />
          {shouldAnimate && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              aria-hidden="true"
              className="ml-0.5 inline-block h-4 w-[7px] translate-y-0.5 bg-brand"
              data-testid="sql-typewriter-caret"
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
        </pre>
      </div>

      <div className="border-t border-line bg-panel px-4 py-2 font-mono text-[11px] text-slate-500 sm:px-6" data-testid="sql-typewriter-status">
        <span className="text-success" aria-hidden="true">●</span> connected — sqlbank_learner (read-only)
      </div>

      <div className="h-[252px] overflow-hidden border-t border-line bg-panel" data-testid="sql-typewriter-results">
        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="h-full overflow-hidden px-4 py-3 sm:px-6"
              exit={{ opacity: 0 }}
              initial={{ opacity: reducedMotion ? 1 : 0 }}
              key={demoIndex}
              transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500" data-testid="sql-typewriter-result-header">
                <span className="text-success" aria-hidden="true">●</span> {rowLabel} · {demo.durationMs}MS
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[360px] border-collapse font-mono text-[11.5px]" data-testid="sql-typewriter-table">
                  <thead data-testid="sql-result-table-header">
                    <tr className="border-y border-white/[0.05] bg-white/[0.025] text-left text-slate-400">
                      {demo.columns.map((column) => (
                        <th className="px-3 py-2 font-medium" key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {demo.rows.map((row, rowIndex) => (
                      <motion.tr
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-white/[0.05] text-slate-300"
                        data-testid={`sql-result-row-${rowIndex}`}
                        initial={reducedMotion || !isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 7 }}
                        key={`${demoIndex}-${rowIndex}`}
                        transition={{ delay: reducedMotion || !isInView ? 0 : rowIndex * 0.05, duration: reducedMotion || !isInView ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {row.map((cell, cellIndex) => (
                          <td className="whitespace-nowrap px-3 py-2" key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              className="flex h-full items-end px-4 py-3 font-mono text-[11px] text-success sm:px-6"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="placeholder"
              transition={{ duration: 0.18 }}
            >
              Correct output appears here instantly.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function HighlightedSql({ sql }: { sql: string }) {
  const tokens = useMemo(() => tokenizeSql(sql), [sql]);
  return (
    <>
      {tokens.map((token, index) => (
        <span className={token.className} key={`${index}-${token.text}`}>{token.text}</span>
      ))}
    </>
  );
}

function tokenizeSql(sql: string) {
  const parts = sql.split(/('(?:''|[^'])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|.)/g).filter(Boolean);
  return parts.map((part) => {
    if (/^'(?:''|[^'])*'$/.test(part)) return { text: part, className: "text-warning" };
    if (/^\d+(?:\.\d+)?$/.test(part)) return { text: part, className: "text-cyan" };
    if (keywordPattern.test(part)) return { text: part, className: "text-brand" };
    return { text: part, className: "text-slate-300" };
  });
}

function useElementInView(ref: RefObject<Element | null>) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "80px 0px",
        threshold: 0.15,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return isInView;
}
