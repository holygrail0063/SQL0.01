"use client";

import { ArrowLeft, RotateCcw, SkipForward } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SqlConceptLesson } from "@/lib/sql-concept-lessons";

export function SqlConceptLessonPanel({ lesson, onComplete, onClose, replay = false }: { lesson: SqlConceptLesson; onComplete?: () => void; onClose?: () => void; replay?: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const steps = useMemo(() => conceptSteps(lesson), [lesson]);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex === steps.length - 1;
  const doneLabel = replay ? "Close" : "Your Turn";

  function finish() {
    if (replay) onClose?.();
    else onComplete?.();
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-editor text-slate-50">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-panel px-5 py-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-cyan">{lesson.kind === "full" ? "Concept Lesson" : "Mini Concept"}</p>
          <h2 className="mt-1 text-xl font-semibold">{lesson.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button className="inline-flex h-9 items-center gap-2 rounded border border-line px-3 text-sm text-slate-300 hover:border-brand-strong/50" onClick={() => setStepIndex((value) => Math.max(0, value - 1))} type="button">
              <ArrowLeft size={15} /> Back
            </button>
          )}
          <button className="inline-flex h-9 items-center gap-2 rounded border border-line px-3 text-sm text-slate-300 hover:border-brand-strong/50" onClick={() => setStepIndex(0)} type="button">
            <RotateCcw size={15} /> Replay
          </button>
          {!replay && (
            <button className="inline-flex h-9 items-center gap-2 rounded border border-line px-3 text-sm text-slate-300 hover:border-brand-strong/50" onClick={finish} type="button">
              <SkipForward size={15} /> Skip
            </button>
          )}
          <button className="inline-flex h-9 items-center rounded bg-brand px-4 text-sm font-semibold text-slate-950" onClick={() => (isLast ? finish() : setStepIndex((value) => Math.min(steps.length - 1, value + 1)))} type="button">
            {isLast ? doneLabel : "Next"}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-0 overflow-auto lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-[380px] items-center justify-center p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${lesson.id}-${stepIndex}`}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              className="w-full max-w-3xl"
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
            >
              <ConceptVisual lesson={lesson} phase={step.visualPhase} reducedMotion={Boolean(shouldReduceMotion)} />
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="border-t border-line bg-panel p-5 lg:border-l lg:border-t-0">
          <div className="flex gap-1">
            {steps.map((item, index) => (
              <button
                aria-label={`Show ${item.label}`}
                className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-brand" : "bg-elevated"}`}
                key={item.label}
                onClick={() => setStepIndex(index)}
                type="button"
              />
            ))}
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-wider text-cyan">{step.label}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-50">{step.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">{step.body}</p>
          {step.kind === "syntax" && <pre className="mt-4 overflow-auto rounded border border-line bg-ink p-4 text-sm leading-6 text-slate-200"><code>{lesson.syntax}</code></pre>}
          {step.kind === "meaning" && (
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {lesson.plainEnglish.map((line) => <li className="rounded border border-line bg-elevated px-3 py-2" key={line}>{line}</li>)}
            </ul>
          )}
          {step.kind === "example" && <pre className="mt-4 overflow-auto rounded border border-line bg-ink p-4 text-sm leading-6 text-slate-200"><code>{lesson.exampleSql}</code></pre>}
          {step.kind === "turn" && <p className="mt-4 rounded border border-brand/30 bg-brand/10 p-3 text-sm leading-6 text-slate-200">{lesson.yourTurn}</p>}
        </aside>
      </div>
    </section>
  );
}

type ConceptStep = {
  label: string;
  title: string;
  body: string;
  kind: "visual" | "syntax" | "meaning" | "example" | "turn";
  visualPhase: number;
};

function conceptSteps(lesson: SqlConceptLesson): ConceptStep[] {
  if (lesson.kind === "mini") {
    return [
      { label: "Idea", title: lesson.shortTitle, body: lesson.summary, kind: "visual", visualPhase: 1 },
      { label: "Syntax", title: "The SQL shape", body: "This is the pattern to recognize when the prompt asks for it.", kind: "syntax", visualPhase: 2 },
      { label: "Your Turn", title: "Use it on the question", body: "The lesson stays out of your way now. Bring the idea into the SQLBank task.", kind: "turn", visualPhase: 3 },
    ];
  }
  return [
    { label: "See", title: lesson.shortTitle, body: lesson.summary, kind: "visual", visualPhase: 1 },
    { label: "Syntax", title: "The SQL shape", body: "SQL keywords have a regular order. Read the pattern first, then map it to the business request.", kind: "syntax", visualPhase: 2 },
    { label: "Meaning", title: "What each part means", body: "Translate the SQL phrase into plain English before writing the final query.", kind: "meaning", visualPhase: 3 },
    { label: "Example", title: lesson.exampleTitle, body: "This example uses a different table so the current SQLBank answer is still yours to write.", kind: "example", visualPhase: 4 },
    { label: "Your Turn", title: "Apply the idea", body: "Now use the same concept on the SQLBank question in front of you.", kind: "turn", visualPhase: 5 },
  ];
}

function ConceptVisual({ lesson, phase, reducedMotion }: { lesson: SqlConceptLesson; phase: number; reducedMotion: boolean }) {
  switch (lesson.visual) {
    case "select-all":
      return <TableVisual columns={["EmployeeID", "Name", "Province", "Status"]} rows={[["101", "Maya", "Ontario", "Active"], ["102", "Liam", "Alberta", "Active"], ["103", "Noah", "Ontario", "Inactive"]]} selectedColumns={[0, 1, 2, 3]} phase={phase} reducedMotion={reducedMotion} />;
    case "select-columns":
      return <TableVisual columns={["EmployeeID", "Name", "Province", "Salary", "StartDate"]} rows={[["101", "Maya", "Ontario", "72000", "2024-01-08"], ["102", "Liam", "Alberta", "68000", "2023-07-11"]]} selectedColumns={[1, 2]} phase={phase} reducedMotion={reducedMotion} />;
    case "filter":
      return <FilterVisual mode="where" phase={phase} reducedMotion={reducedMotion} />;
    case "and-filter":
      return <FilterVisual mode="and" phase={phase} reducedMotion={reducedMotion} />;
    case "or-filter":
      return <FilterVisual mode="or" phase={phase} reducedMotion={reducedMotion} />;
    case "collapse-sql":
      return <CollapseSqlVisual phase={phase} reducedMotion={reducedMotion} />;
    case "like":
      return <LikeVisual phase={phase} reducedMotion={reducedMotion} />;
    case "nulls":
      return <NullVisual phase={phase} reducedMotion={reducedMotion} />;
    case "sort":
      return <SortVisual phase={phase} reducedMotion={reducedMotion} />;
    case "top":
      return <TopVisual phase={phase} reducedMotion={reducedMotion} />;
    case "distinct":
      return <DistinctVisual phase={phase} reducedMotion={reducedMotion} />;
    case "alias":
      return <AliasVisual phase={phase} reducedMotion={reducedMotion} />;
    case "aggregate":
      return <AggregateVisual concept={lesson.id} phase={phase} reducedMotion={reducedMotion} />;
    case "min-max":
      return <MinMaxVisual phase={phase} reducedMotion={reducedMotion} />;
    case "group":
      return <GroupVisual phase={phase} reducedMotion={reducedMotion} />;
    case "having":
      return <HavingVisual phase={phase} reducedMotion={reducedMotion} />;
    case "join":
      return <JoinVisual phase={phase} reducedMotion={reducedMotion} />;
    case "join-chain":
      return <JoinChainVisual phase={phase} reducedMotion={reducedMotion} />;
    case "left-join":
      return <LeftJoinVisual phase={phase} reducedMotion={reducedMotion} />;
    case "unmatched":
      return <UnmatchedVisual phase={phase} reducedMotion={reducedMotion} />;
    case "case":
      return <CaseVisual phase={phase} reducedMotion={reducedMotion} />;
    case "timeline":
      return <TimelineVisual phase={phase} reducedMotion={reducedMotion} />;
    case "date-overlap":
      return <DateOverlapVisual phase={phase} reducedMotion={reducedMotion} />;
    case "conditional-aggregation":
      return <ConditionalAggregationVisual phase={phase} reducedMotion={reducedMotion} />;
    case "kpi":
      return <KpiVisual phase={phase} reducedMotion={reducedMotion} />;
    case "number-line":
    default:
      return <NumberLineVisual phase={phase} reducedMotion={reducedMotion} />;
  }
}

function MotionBox({ children, className, delay = 0, phase, reducedMotion }: { children?: ReactNode; className?: string; delay?: number; phase: number; reducedMotion: boolean }) {
  return (
    <motion.div animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }} className={className} initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.28, delay: reducedMotion ? 0 : delay + phase * 0.03 }}>
      {children}
    </motion.div>
  );
}

function TableVisual({ columns, rows, selectedColumns, phase, reducedMotion }: { columns: string[]; rows: string[][]; selectedColumns: number[]; phase: number; reducedMotion: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-2xl shadow-black/20">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>{columns.map((column, index) => <th className={`border-b border-line px-3 py-2 ${selectedColumns.includes(index) || phase < 2 ? "text-brand" : "text-slate-600"}`} key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={row.join("-")}>{row.map((cell, cellIndex) => <td className={`border-b border-line/60 px-3 py-2 transition ${selectedColumns.includes(cellIndex) || phase < 2 ? "text-slate-200" : "text-slate-700"}`} key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
      <MotionBox className="mt-4 rounded border border-brand/30 bg-brand/10 px-3 py-2 font-mono text-sm text-brand" phase={phase} reducedMotion={reducedMotion}>SELECT {selectedColumns.length === columns.length ? "*" : selectedColumns.map((index) => columns[index]).join(", ")}</MotionBox>
    </div>
  );
}

function FilterVisual({ mode, phase, reducedMotion }: { mode: "where" | "and" | "or"; phase: number; reducedMotion: boolean }) {
  const rows = mode === "and"
    ? [["Maya", "Ontario", "Active", true], ["Liam", "Ontario", "Inactive", false], ["Noah", "Alberta", "Active", false], ["Emma", "Ontario", "Active", true]]
    : [["Maya", "Ontario", "Active", true], ["Liam", "Alberta", "Active", mode === "or"], ["Noah", "Ontario", "Inactive", true], ["Emma", "Quebec", "Active", false]];
  return <RowFilterTable rows={rows} label={mode === "and" ? "Province = 'Ontario' AND Status = 'Active'" : mode === "or" ? "Province = 'Ontario' OR Province = 'Alberta'" : "Province = 'Ontario'"} phase={phase} reducedMotion={reducedMotion} />;
}

function RowFilterTable({ rows, label, phase, reducedMotion }: { rows: (string | boolean)[][]; label: string; phase: number; reducedMotion: boolean }) {
  return <div className="rounded-lg border border-line bg-panel p-4"><div className="grid gap-2">{rows.map((row, index) => <MotionBox className={`grid grid-cols-3 rounded border px-3 py-2 text-sm ${row[3] || phase < 2 ? "border-brand/30 bg-brand/10 text-slate-100" : "border-line bg-ink text-slate-600"}`} delay={index * 0.04} key={`${row[0]}-${row[1]}`} phase={phase} reducedMotion={reducedMotion}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span></MotionBox>)}</div><div className="mt-4 rounded bg-ink p-3 font-mono text-sm text-brand">WHERE {label}</div></div>;
}

function NumberLineVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <div className="rounded-lg border border-line bg-panel p-6"><div className="relative h-20"><div className="absolute left-0 right-0 top-10 h-1 bg-slate-700" /><MotionBox className="absolute left-[34%] top-8 h-5 w-[34%] rounded-full bg-brand" phase={phase} reducedMotion={reducedMotion} /><div className="absolute left-[30%] top-14 text-sm text-slate-300">10000</div><div className="absolute left-[65%] top-14 text-sm text-slate-300">20000</div></div><p className="font-mono text-sm text-brand">BETWEEN includes both boundaries. At least means &gt;=.</p></div>;
}

function CollapseSqlVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <div className="grid gap-4 rounded-lg border border-line bg-panel p-5"><MotionBox className="rounded bg-ink p-4 font-mono text-sm text-slate-300" phase={phase} reducedMotion={reducedMotion}>Province = 'Ontario'<br />OR Province = 'Alberta'<br />OR Province = 'Manitoba'</MotionBox><MotionBox className="rounded border border-brand/30 bg-brand/10 p-4 font-mono text-sm text-brand" delay={0.1} phase={phase} reducedMotion={reducedMotion}>Province IN ('Ontario', 'Alberta', 'Manitoba')</MotionBox></div>;
}

function LikeVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const names = ["Akash", "Amanda", "Ben", "Adam", "Sarah"];
  return <div className="rounded-lg border border-line bg-panel p-5"><div className="grid gap-2 sm:grid-cols-5">{names.map((name) => <MotionBox className={`rounded border px-3 py-4 text-center ${name.startsWith("A") || phase < 2 ? "border-brand/40 bg-brand/10 text-slate-50" : "border-line bg-ink text-slate-600"}`} key={name} phase={phase} reducedMotion={reducedMotion}>{name}</MotionBox>)}</div><p className="mt-4 font-mono text-sm text-brand">LIKE 'A%'</p></div>;
}

function NullVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const values = ["2025-01-01", "NULL", "2024-08-11", "NULL"];
  return <div className="rounded-lg border border-line bg-panel p-5"><div className="grid gap-2">{values.map((value, index) => <MotionBox className={`rounded border px-3 py-3 font-mono text-sm ${value === "NULL" || phase < 2 ? "border-brand/40 bg-brand/10 text-brand" : "border-line bg-ink text-slate-500"}`} key={`${value}-${index}`} phase={phase} reducedMotion={reducedMotion}>{value}</MotionBox>)}</div><p className="mt-4 text-sm text-slate-300">NULL means missing or unknown.</p></div>;
}

function SortVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const values = phase < 2 ? [4000, 22000, 8000, 15000] : [22000, 15000, 8000, 4000];
  return <ListVisual values={values.map(String)} label="ORDER BY Amount DESC" phase={phase} reducedMotion={reducedMotion} />;
}

function TopVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const values = [22000, 15000, 8000, 4000, 1200];
  return <ListVisual values={values.map((value, index) => phase > 1 && index > 1 ? `${value} filtered out` : String(value))} label="SELECT TOP 2 ... ORDER BY Amount DESC" phase={phase} reducedMotion={reducedMotion} />;
}

function DistinctVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const values = phase < 2 ? ["Ontario", "Alberta", "Ontario", "Quebec", "Ontario"] : ["Ontario", "Alberta", "Quebec"];
  return <ListVisual values={values} label="SELECT DISTINCT Province" phase={phase} reducedMotion={reducedMotion} />;
}

function AliasVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <div className="rounded-lg border border-line bg-panel p-6 text-center"><MotionBox className="mx-auto max-w-sm rounded border border-line bg-ink px-5 py-4 font-mono text-lg text-slate-200" phase={phase} reducedMotion={reducedMotion}>{phase < 2 ? "CustomerID" : "CustomerNumber"}</MotionBox><p className="mt-4 font-mono text-sm text-brand">CustomerID AS CustomerNumber</p></div>;
}

function AggregateVisual({ concept, phase, reducedMotion }: { concept: string; phase: number; reducedMotion: boolean }) {
  const values = concept === "count" ? ["row", "row", "row", "row", "row"] : concept === "avg" ? ["100", "250", "150", "avg = 166.67"] : ["100", "250", "150", "500"];
  return <ListVisual values={phase < 2 ? values.slice(0, 3) : [values[values.length - 1]]} label={concept === "count" ? "COUNT(*) -> 5" : concept === "avg" ? "AVG(Amount)" : "SUM(Amount)"} phase={phase} reducedMotion={reducedMotion} />;
}

function MinMaxVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <ListVisual values={["100 min", "250", "150", "900 max"]} label="MIN(Amount), MAX(Amount)" phase={phase} reducedMotion={reducedMotion} />;
}

function GroupVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const values = phase < 2 ? ["Ontario", "Alberta", "Ontario", "Quebec", "Ontario", "Alberta"] : ["Ontario -> 3", "Alberta -> 2", "Quebec -> 1"];
  return <ListVisual values={values} label="GROUP BY Province" phase={phase} reducedMotion={reducedMotion} />;
}

function HavingVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const values = phase < 2 ? ["Ontario -> 67", "Alberta -> 84", "Quebec -> 49"] : ["Ontario -> 67", "Alberta -> 84"];
  return <ListVisual values={values} label="HAVING COUNT(*) > 50" phase={phase} reducedMotion={reducedMotion} />;
}

function JoinVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <div className="grid gap-4 rounded-lg border border-line bg-panel p-5 md:grid-cols-[1fr_auto_1fr]"><MiniTable title="Customers" rows={[["101", "Maya"], ["102", "Alex"]]} /><MotionBox className="self-center text-center font-mono text-brand" phase={phase} reducedMotion={reducedMotion}>CustomerID<br />matches</MotionBox><MiniTable title="Loans" rows={[["501", "101", "5000"], ["502", "102", "8000"]]} /><div className="md:col-span-3"><ListVisual values={["Maya | 5000", "Alex | 8000"]} label="ON l.CustomerID = c.CustomerID" phase={phase} reducedMotion={reducedMotion} /></div></div>;
}

function JoinChainVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <ListVisual values={["Customers", "Loans", "Payments"]} label="Customers -> Loans -> Payments" phase={phase} reducedMotion={reducedMotion} />;
}

function LeftJoinVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const values = phase < 2 ? ["Maya -> loan", "Alex -> loan"] : ["Maya -> loan", "Alex -> loan", "Sam -> NULL"];
  return <ListVisual values={values} label="LEFT JOIN keeps Sam" phase={phase} reducedMotion={reducedMotion} />;
}

function UnmatchedVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const values = phase < 2 ? ["Maya -> loan", "Alex -> loan", "Sam -> NULL"] : ["Sam -> NULL"];
  return <ListVisual values={values} label="WHERE joined_table.id IS NULL" phase={phase} reducedMotion={reducedMotion} />;
}

function CaseVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <ListVisual values={["Amount < 10000 -> Small", "Amount < 25000 -> Medium", "Else -> Large"]} label="CASE WHEN ... THEN ... ELSE ... END" phase={phase} reducedMotion={reducedMotion} />;
}

function TimelineVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <div className="rounded-lg border border-line bg-panel p-6"><div className="relative h-24"><div className="absolute left-0 right-0 top-10 h-1 bg-slate-700" /><MotionBox className="absolute left-[32%] top-8 h-5 w-[34%] rounded-full bg-brand" phase={phase} reducedMotion={reducedMotion} /><span className="absolute left-[30%] top-14 text-sm">2025-01-01</span><span className="absolute left-[62%] top-14 text-sm">2026-01-01</span></div><p className="font-mono text-sm text-brand">DateColumn &gt;= start AND DateColumn &lt; next start</p></div>;
}

function DateOverlapVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <div className="rounded-lg border border-line bg-panel p-6"><div className="relative h-24"><div className="absolute left-[15%] right-[15%] top-10 h-1 bg-brand" /><MotionBox className="absolute left-1/2 top-6 h-10 w-1 rounded bg-cyan" phase={phase} reducedMotion={reducedMotion} /><span className="absolute left-[12%] top-14 text-sm">Start</span><span className="absolute left-[45%] top-14 text-sm text-cyan">Target</span><span className="absolute right-[12%] top-14 text-sm">End</span></div></div>;
}

function ConditionalAggregationVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const values = phase < 2 ? ["Active", "Inactive", "Active", "Active", "Closed"] : ["1", "0", "1", "1", "0", "SUM = 3"];
  return <ListVisual values={values} label="SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END)" phase={phase} reducedMotion={reducedMotion} />;
}

function KpiVisual({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  return <ListVisual values={phase < 2 ? ["Applications = 10", "Approved = 7"] : ["7 / 10 = 0.70", "0.70 * 100 = 70%"]} label="100.0 * Approved / Applications" phase={phase} reducedMotion={reducedMotion} />;
}

function ListVisual({ values, label, phase, reducedMotion }: { values: string[]; label: string; phase: number; reducedMotion: boolean }) {
  return <div className="rounded-lg border border-line bg-panel p-5"><div className="grid gap-2">{values.map((value, index) => <MotionBox className="rounded border border-line bg-ink px-4 py-3 font-mono text-sm text-slate-200" delay={index * 0.04} key={`${value}-${index}`} phase={phase} reducedMotion={reducedMotion}>{value}</MotionBox>)}</div><p className="mt-4 rounded border border-brand/30 bg-brand/10 px-3 py-2 font-mono text-sm text-brand">{label}</p></div>;
}

function MiniTable({ title, rows }: { title: string; rows: string[][] }) {
  return <div className="rounded border border-line bg-ink p-3"><p className="mb-2 font-mono text-xs uppercase tracking-wider text-cyan">{title}</p>{rows.map((row) => <div className="grid grid-cols-3 gap-2 border-t border-line/60 py-2 text-sm text-slate-300" key={row.join("-")}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div>;
}
