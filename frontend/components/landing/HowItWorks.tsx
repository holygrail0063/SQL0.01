"use client";

import { motion, useReducedMotion } from "framer-motion";

const STEPS = [
  { num: "01", title: "Choose your goal" },
  { num: "02", title: "Solve SQL challenges" },
  { num: "03", title: "Query real databases" },
  { num: "04", title: "Get immediate feedback" },
  { num: "05", title: "Build real-world ability" },
];

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-7xl px-5 py-20" id="how-it-works">
      <motion.h2
        className="text-3xl font-semibold text-slate-50"
        data-testid="how-it-works-heading"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, margin: "-80px" }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      >
        How it works
      </motion.h2>
      <div className="relative">
        <motion.div
          aria-hidden="true"
          className="absolute left-[10%] right-[10%] top-[3.85rem] z-0 hidden h-px bg-gradient-to-r from-brand/60 via-brand/25 to-transparent md:block"
          data-testid="how-it-works-connector"
          initial={shouldReduceMotion ? false : { scaleX: 0 }}
          style={{ transformOrigin: "left" }}
          transition={{ duration: shouldReduceMotion ? 0 : 1.4, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          whileInView={{ scaleX: 1 }}
        />
        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-5"
          initial={shouldReduceMotion ? false : "hidden"}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView="show"
        >
          {STEPS.map((step) => (
            <motion.div
              className="group relative z-10 rounded border border-line bg-panel p-5 transition-colors duration-300 hover:border-brand/25"
              data-testid={`step-card-${step.num}`}
              key={step.num}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              variants={cardVariants}
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
            >
              <div className="relative inline-flex">
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                />
                <motion.span
                  className="relative font-mono text-sm text-cyan"
                  data-testid={`step-number-${step.num}`}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
                >
                  {step.num}
                </motion.span>
              </div>
              <p className="mt-4 font-semibold text-slate-50">{step.title}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
