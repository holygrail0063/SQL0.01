import Link from "next/link";
import { ArrowRight, BarChart3, Database, ShieldCheck, TerminalSquare } from "lucide-react";
import { AuthHashRedirect } from "@/components/AuthHashRedirect";
import { SqlTypewriter } from "@/components/animations/SqlTypewriter";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingAuthModal } from "@/components/landing/LandingAuthModal";
import { LandingAuthTrigger } from "@/components/landing/LandingAuthTrigger";
import { PublicHeader } from "@/components/PublicHeader";
import { LEARNING_MODES } from "@/lib/curriculum";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink text-slate-50" id="main-content">
      <AuthHashRedirect />
      <PublicHeader />
      <LandingAuthModal />

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <p className="mb-4 font-mono text-sm text-cyan">QueryRight / SQL practice platform</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-slate-50 md:text-6xl">Practice SQL like it&apos;s your job.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Build real SQL skills by solving realistic business problems against a hands-on SQLBank training database directly in your browser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LandingAuthTrigger className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-brand/80" mode="signup" testId="landing-hero-start-learning-trigger">
              Start Learning Free
              <ArrowRight size={17} />
            </LandingAuthTrigger>
            <a className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold text-slate-300 hover:border-brand-strong/50" href="#product">
              See How It Works
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">Stop watching SQL. Start writing it.</p>
        </div>

        <SqlTypewriter />
      </section>

      <section className="border-y border-line bg-panel/60" id="product">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <h2 className="text-3xl font-semibold text-slate-50">Learn SQL by doing SQL.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [Database, "Real Databases", "Query realistic datasets instead of memorizing isolated SQL syntax."],
              [BarChart3, "Real Business Problems", "Solve the kinds of questions analysts and data professionals encounter at work."],
              [ShieldCheck, "Instant Feedback", "Run your query and immediately see whether your solution produces the correct result."],
            ].map(([Icon, title, copy]) => (
              <div className="rounded-lg border border-line bg-panel p-6" key={String(title)}>
                <Icon className="text-cyan" size={24} />
                <h3 className="mt-5 text-lg font-semibold text-slate-50">{String(title)}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{String(copy)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[0.85fr_1fr]" id="about">
        <div>
          <p className="font-mono text-sm text-cyan">First environment</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-50">Welcome to SQLBank</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Step into the role of an analyst at SQLBank and solve progressively harder business problems using real SQL.
            SQLBank is a fictional training environment created only for QueryRight.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-5 font-mono text-sm text-slate-300">
          <p className="mb-4 text-cyan">SQLBankTraining</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Customers: CustomerID, FirstName, LastName, Province, City", "Applications: ApplicationID, CustomerID, BranchID, RequestedAmount, Status", "Loans: LoanID, CustomerID, BranchID, LoanAmount, InterestRate", "Payments: PaymentID, LoanID, Amount, PaymentStatus"].map((item) => (
              <div className="rounded border border-line bg-elevated p-3" key={item}>{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-panel/60" id="paths">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <h2 className="text-3xl font-semibold text-slate-50">Choose how you want to learn SQL.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {LEARNING_MODES.map((mode) => (
              <div className="rounded-lg border border-line bg-panel p-5" key={mode.id}>
                <h3 className="font-semibold text-slate-50">{mode.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{mode.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <TerminalSquare className="mx-auto text-cyan" size={30} />
        <h2 className="mt-5 text-4xl font-semibold text-slate-50">Stop watching SQL. Start writing it.</h2>
        <p className="mt-4 text-slate-300">Your first SQL challenge is ready.</p>
        <LandingAuthTrigger className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-slate-950" mode="signup" testId="landing-final-start-learning-trigger">
          Start Learning Free
          <ArrowRight size={17} />
        </LandingAuthTrigger>
      </section>

      <footer className="border-t border-line px-5 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <span>QueryRight</span>
          <div className="flex flex-wrap gap-4">
            <a href="/#product">Product</a>
            <a href="/#how-it-works">How It Works</a>
            <a href="/#paths">Learning Modes</a>
            <LandingAuthTrigger className="text-left" mode="login" testId="landing-footer-login-trigger">Login</LandingAuthTrigger>
            <LandingAuthTrigger className="text-left" mode="signup" testId="landing-footer-signup-trigger">Sign Up</LandingAuthTrigger>
          </div>
        </div>
      </footer>
    </main>
  );
}
