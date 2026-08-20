import Link from "next/link";
import { ArrowRight, BarChart3, Database, Play, ShieldCheck, TerminalSquare } from "lucide-react";
import { AuthHashRedirect } from "@/components/AuthHashRedirect";
import { PublicHeader } from "@/components/PublicHeader";

const roleCards = [
  ["Business Analyst", "SELECT, JOIN, GROUP BY, KPIs, reconciliation"],
  ["Data Analyst", "aggregations, CTEs, trends, segmentation, cohorts"],
  ["Data Scientist", "complex extraction, feature preparation, analytical datasets"],
  ["Data Engineer", "transformations, data quality, deduplication, ETL-style SQL"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink text-slate-100">
      <AuthHashRedirect />
      <PublicHeader />

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <p className="mb-4 font-mono text-sm text-cyan">QueryRight / SQL practice platform</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white md:text-6xl">Practice SQL like it&apos;s your job.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Build real SQL skills by solving realistic business problems against real databases directly in your browser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand/90" href="/signup">
              Start Learning Free
              <ArrowRight size={17} />
            </Link>
            <a className="inline-flex items-center gap-2 rounded border border-line px-5 py-3 text-sm font-semibold text-slate-200 hover:border-cyan/70" href="#product">
              See How It Works
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">Stop watching SQL. Start writing it.</p>
        </div>

        <div className="rounded border border-line bg-panel shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">SQLBank / Loan Analytics</p>
              <p className="font-mono text-xs text-slate-500">Task #010</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded bg-brand px-3 py-2 text-xs font-semibold text-white" type="button">
              <Play size={14} fill="currentColor" />
              Run Query
            </button>
          </div>
          <div className="grid min-h-[410px] grid-cols-1 md:grid-cols-[1fr_220px]">
            <div className="border-r border-line">
              <div className="border-b border-line p-4">
                <h2 className="text-lg font-semibold text-white">Find the five branches with the highest loan approval rate.</h2>
                <p className="mt-2 text-sm text-slate-400">Intermediate • Business Analysis</p>
              </div>
              <pre className="min-h-[250px] overflow-hidden p-5 font-mono text-sm leading-7 text-slate-300">
                <span className="text-slate-600">1</span> SELECT{"\n"}
                <span className="text-slate-600">2</span>   b.BranchName,{"\n"}
                <span className="text-slate-600">3</span>   COUNT(*) AS Applications{"\n"}
                <span className="text-slate-600">4</span> FROM Applications a{"\n"}
                <span className="text-slate-600">5</span> JOIN Branches b ON ...{"\n"}
                <span className="text-cyan">6</span> <span className="inline-block h-4 w-2 translate-y-1 bg-cyan" />
              </pre>
              <div className="border-t border-line px-5 py-3 text-sm text-success">Correct output appears here instantly.</div>
            </div>
            <aside className="p-4 font-mono text-xs text-slate-400">
              <p className="mb-4 text-cyan">SQLBankTraining</p>
              {["Customers", "Branches", "Applications", "Loans", "Payments"].map((table) => (
                <p className="mb-3" key={table}>▸ {table}</p>
              ))}
            </aside>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-panel/60" id="product">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <h2 className="text-3xl font-semibold text-white">Learn SQL by doing SQL.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [Database, "Real Databases", "Query realistic datasets instead of memorizing isolated SQL syntax."],
              [BarChart3, "Real Business Problems", "Solve the kinds of questions analysts and data professionals encounter at work."],
              [ShieldCheck, "Instant Feedback", "Run your query and immediately see whether your solution produces the correct result."],
            ].map(([Icon, title, copy]) => (
              <div className="rounded border border-line bg-[#0d1422] p-6" key={String(title)}>
                <Icon className="text-cyan" size={24} />
                <h3 className="mt-5 text-lg font-semibold text-white">{String(title)}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{String(copy)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[0.85fr_1fr]" id="about">
        <div>
          <p className="font-mono text-sm text-cyan">First environment</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Welcome to SQLBank</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Step into the role of an analyst at SQLBank and solve progressively harder business problems using real SQL.
            SQLBank is a fictional training environment created only for QueryRight.
          </p>
        </div>
        <div className="rounded border border-line bg-panel p-5 font-mono text-sm text-slate-300">
          <p className="mb-4 text-cyan">SQLBankTraining</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Customers: CustomerID, FirstName, LastName, Province, City", "Applications: ApplicationID, CustomerID, BranchID, RequestedAmount, Status", "Loans: LoanID, CustomerID, BranchID, LoanAmount, InterestRate", "Payments: PaymentID, LoanID, Amount, PaymentStatus"].map((item) => (
              <div className="rounded border border-line bg-[#090f1a] p-3" key={item}>{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-panel/60" id="paths">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <h2 className="text-3xl font-semibold text-white">SQL for where you&apos;re going.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roleCards.map(([title, copy]) => (
              <div className="rounded border border-line bg-[#0d1422] p-5" key={title}>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
                <p className="mt-4 font-mono text-xs text-cyan">V0.2: goal tracking</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20" id="how-it-works">
        <h2 className="text-3xl font-semibold text-white">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {["Choose your goal", "Solve SQL challenges", "Query real databases", "Get immediate feedback", "Build real-world ability"].map((step, index) => (
            <div className="rounded border border-line bg-panel p-5" key={step}>
              <p className="font-mono text-sm text-cyan">0{index + 1}</p>
              <p className="mt-4 font-semibold text-white">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <TerminalSquare className="mx-auto text-cyan" size={30} />
        <h2 className="mt-5 text-4xl font-semibold text-white">Stop watching SQL. Start writing it.</h2>
        <p className="mt-4 text-slate-300">Your first SQL challenge is ready.</p>
        <Link className="mt-8 inline-flex items-center gap-2 rounded bg-brand px-5 py-3 text-sm font-semibold text-white" href="/signup">
          Start Learning Free
          <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="border-t border-line px-5 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <span>QueryRight</span>
          <div className="flex flex-wrap gap-4">
            <a href="/#product">Product</a>
            <a href="/#how-it-works">How It Works</a>
            <a href="/#paths">Learning Paths</a>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
            <span>Privacy placeholder</span>
            <span>Terms placeholder</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
