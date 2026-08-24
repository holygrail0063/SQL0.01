"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { requireSupabase } from "@/lib/supabase";
import { SUPPORT_TOPICS, type SupportTopic } from "@/lib/support-topics";

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <HelpContent />
      </AppShell>
    </ProtectedRoute>
  );
}

type FieldErrors = Partial<Record<"topic" | "subject" | "message", string>>;

function HelpContent() {
  const { user } = useAuth();
  const [topic, setTopic] = useState<SupportTopic | "">("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const replyNote = useMemo(() => {
    if (!user?.email) return "Your account details are included automatically so we can investigate your request.";
    return `Replies will be associated with ${user.email}. Your basic account context is included automatically.`;
  }, [user?.email]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const errors = validateForm(topic, subject, message);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const client = requireSupabase();
      const { data } = await client.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Please log in before sending a support request.");

      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          subject,
          message,
          pagePath: `${window.location.pathname}${window.location.search}`,
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "We couldn't send your message. Please try again.");

      setSent(true);
      setSubject("");
      setMessage("");
      setTopic("");
      setFieldErrors({});
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "We couldn't send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function sendAnother() {
    setSent(false);
    setSubmitError(null);
    setFieldErrors({});
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10" data-testid="help-support-page">
      <p className="font-mono text-sm text-cyan">Account</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-50">Help & Support</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        Have a question or ran into a problem? Send us a message and we&apos;ll take a look.
      </p>

      <section className="mt-8 max-w-3xl rounded-lg border border-line bg-panel p-5 shadow-sm shadow-black/20 sm:p-6">
        {sent ? (
          <div aria-live="polite" className="rounded-lg border border-success/30 bg-success/10 p-5" data-testid="help-success" role="status">
            <p className="text-sm font-semibold text-success">✓ Message sent</p>
            <h2 className="mt-3 text-xl font-semibold text-slate-50">Thanks for reaching out.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Your request has been submitted successfully. We&apos;ll use the details you provided to investigate.
            </p>
            <button
              className="mt-5 rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-brand-strong/50 hover:text-slate-50"
              data-testid="help-send-another"
              onClick={sendAnother}
              type="button"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form className="space-y-5" data-testid="help-support-form" noValidate onSubmit={submit}>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-cyan">Contact Support</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-50">How can QueryRight help?</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200" htmlFor="help-topic">
                What can we help with?
              </label>
              <select
                aria-describedby={fieldErrors.topic ? "help-topic-error" : undefined}
                aria-invalid={Boolean(fieldErrors.topic)}
                className="mt-2 h-11 w-full rounded border border-line bg-elevated px-3 text-slate-50 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
                data-testid="help-topic"
                id="help-topic"
                onChange={(event) => {
                  setTopic(event.target.value as SupportTopic | "");
                  setFieldErrors((current) => ({ ...current, topic: undefined }));
                  setSubmitError(null);
                }}
                value={topic}
              >
                <option value="">Select a topic</option>
                {SUPPORT_TOPICS.map((supportTopic) => (
                  <option key={supportTopic} value={supportTopic}>
                    {supportTopic}
                  </option>
                ))}
              </select>
              {fieldErrors.topic && (
                <p className="mt-2 text-sm text-danger" id="help-topic-error">
                  {fieldErrors.topic}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200" htmlFor="help-subject">
                Subject
              </label>
              <input
                aria-describedby={fieldErrors.subject ? "help-subject-error" : undefined}
                aria-invalid={Boolean(fieldErrors.subject)}
                className="mt-2 h-11 w-full rounded border border-line bg-elevated px-3 text-slate-50 outline-none transition placeholder:text-slate-600 focus:border-brand focus:ring-2 focus:ring-brand/30"
                data-testid="help-subject"
                id="help-subject"
                maxLength={120}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setFieldErrors((current) => ({ ...current, subject: undefined }));
                  setSubmitError(null);
                }}
                placeholder="Briefly describe your question"
                value={subject}
              />
              {fieldErrors.subject && (
                <p className="mt-2 text-sm text-danger" id="help-subject-error">
                  {fieldErrors.subject}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200" htmlFor="help-message">
                Message
              </label>
              <textarea
                aria-describedby={`help-message-helper${fieldErrors.message ? " help-message-error" : ""}`}
                aria-invalid={Boolean(fieldErrors.message)}
                className="mt-2 min-h-40 w-full resize-y rounded border border-line bg-elevated px-3 py-3 text-slate-50 outline-none transition placeholder:text-slate-600 focus:border-brand focus:ring-2 focus:ring-brand/30"
                data-testid="help-message"
                id="help-message"
                maxLength={5000}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setFieldErrors((current) => ({ ...current, message: undefined }));
                  setSubmitError(null);
                }}
                placeholder="Tell us what happened, what you expected, and anything else that might help."
                value={message}
              />
              <p className="mt-2 text-sm text-slate-500" id="help-message-helper">
                For technical issues, include what you were doing when the problem occurred.
              </p>
              {fieldErrors.message && (
                <p className="mt-2 text-sm text-danger" id="help-message-error">
                  {fieldErrors.message}
                </p>
              )}
            </div>

            {submitError && (
              <div aria-live="polite" className="status-error rounded border p-3 text-sm" data-testid="help-error" role="alert">
                {submitError}
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-slate-500">{replyNote}</p>
              <button
                className="inline-flex h-11 items-center justify-center rounded bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand/85 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                data-testid="help-submit"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Sending..." : "Send message"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function validateForm(topic: SupportTopic | "", subject: string, message: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!topic) errors.topic = "Choose a support topic.";
  if (!subject.trim()) errors.subject = "Add a subject.";
  if (subject.trim().length > 120) errors.subject = "Keep the subject under 120 characters.";
  if (!message.trim()) errors.message = "Add a message.";
  if (message.trim().length > 5000) errors.message = "Keep the message under 5000 characters.";
  return errors;
}
