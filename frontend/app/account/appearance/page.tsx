"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT_ID,
  applyAccent,
  cacheAccent,
  normalizeAccentId,
  type AccentId,
  type AccentPreset,
} from "@/lib/accent";
import { useAuth } from "@/lib/auth";
import { getProfile, saveProfile } from "@/lib/progress";

export default function AppearancePage() {
  return (
    <ProtectedRoute>
      <AppShell manageAccent={false}>
        <AppearanceContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AppearanceContent() {
  const { user } = useAuth();
  const [savedAccent, setSavedAccent] = useState<AccentId>(DEFAULT_ACCENT_ID);
  const [draftAccent, setDraftAccent] = useState<AccentId>(DEFAULT_ACCENT_ID);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedAccentRef = useRef<AccentId>(DEFAULT_ACCENT_ID);

  useEffect(() => {
    savedAccentRef.current = savedAccent;
  }, [savedAccent]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    getProfile(user)
      .then((profile) => {
        if (!active) return;
        const accent = normalizeAccentId(profile?.accent_color);
        setSavedAccent(accent);
        setDraftAccent(accent);
        applyAccent(accent);
      })
      .catch(() => {
        if (!active) return;
        setError("Appearance settings could not be loaded.");
        applyAccent(DEFAULT_ACCENT_ID);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      applyAccent(savedAccentRef.current);
    };
  }, [user]);

  const isDirty = draftAccent !== savedAccent;

  function selectAccent(accentId: AccentId) {
    setDraftAccent(accentId);
    setMessage(null);
    setError(null);
    applyAccent(accentId);
  }

  function resetToDefault() {
    selectAccent(DEFAULT_ACCENT_ID);
  }

  function cancelChanges() {
    setDraftAccent(savedAccent);
    setMessage(null);
    setError(null);
    applyAccent(savedAccent);
  }

  async function saveChanges() {
    if (!user || !isDirty) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const saved = await saveProfile(user, { accent_color: draftAccent });
      const persistedAccent = normalizeAccentId(saved.accent_color ?? draftAccent);
      setSavedAccent(persistedAccent);
      setDraftAccent(persistedAccent);
      applyAccent(persistedAccent);
      cacheAccent(user.id, persistedAccent);
      setMessage("Appearance updated.");
    } catch {
      setError("We couldn't save your appearance settings. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">Account</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-50">Appearance</h1>

      <section className="mt-8 rounded-lg border border-line bg-panel p-6" data-testid="appearance-accent-settings">
        <fieldset disabled={loading || saving}>
          <legend className="text-lg font-semibold text-slate-50">Accent color</legend>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Personalize QueryRight&apos;s interactive accents. The dark interface stays unchanged.
          </p>

          <div className="mt-6 grid gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {ACCENT_PRESETS.map((preset) => (
              <AccentPresetOption
                checked={draftAccent === preset.id}
                key={preset.id}
                onSelect={() => selectAccent(preset.id)}
                preset={preset}
              />
            ))}
          </div>
        </fieldset>

        {message && <p className="mt-5 text-sm text-success">✓ {message}</p>}
        {error && <p className="status-error mt-5 rounded border p-3 text-sm">{error}</p>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="self-start rounded border border-line px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-brand-strong/50 hover:text-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            data-testid="appearance-reset-default"
            disabled={loading || saving || draftAccent === DEFAULT_ACCENT_ID}
            onClick={resetToDefault}
            type="button"
          >
            Reset to default
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded border border-line px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-brand-strong/50 hover:text-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              data-testid="appearance-cancel"
              disabled={loading || saving || !isDirty}
              onClick={cancelChanges}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand/85 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              data-testid="appearance-save"
              disabled={loading || saving || !isDirty}
              onClick={saveChanges}
              type="button"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function AccentPresetOption({
  checked,
  onSelect,
  preset,
}: {
  checked: boolean;
  onSelect: () => void;
  preset: AccentPreset;
}) {
  const swatchStyle = {
    background: `linear-gradient(135deg, ${preset.primary}, ${preset.strong})`,
  } satisfies CSSProperties;

  return (
    <label
      className={`group relative min-h-32 cursor-pointer rounded-lg border bg-elevated p-4 transition ${
        checked ? "border-brand bg-brand/10 shadow-[0_0_0_1px_rgb(var(--color-brand)/0.2)]" : "border-line hover:border-brand/40 hover:bg-brand/5"
      }`}
      data-selected={checked ? "true" : "false"}
      data-testid={`accent-preset-${preset.id}`}
    >
      <input
        checked={checked}
        className="peer sr-only"
        name="accent-color"
        onChange={onSelect}
        type="radio"
        value={preset.id}
      />
      <span className="pointer-events-none absolute inset-0 rounded-lg transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-panel" />
      <span aria-hidden="true" className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 shadow-inner shadow-black/30" style={swatchStyle}>
        <span className="h-4 w-4 rounded-full bg-white/35" />
      </span>
      <span className="mt-8 flex items-center justify-between gap-3 text-sm font-semibold text-slate-50">
        <span>{preset.name}</span>
        <span className={checked ? "font-mono text-xs text-brand" : "font-mono text-xs text-transparent"} aria-hidden={!checked}>
          ✓
        </span>
      </span>
      <span className="sr-only">{checked ? `${preset.name}, selected` : preset.name}</span>
    </label>
  );
}
