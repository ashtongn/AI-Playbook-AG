"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CircleAlert, Lock, Plus, Save, Trash2, X } from "lucide-react";
import PageHero from "@/components/PageHero";
import { PLAY_CATEGORIES } from "@/content/categories";
import { COMMUNITIES, COMMUNITY_LEVEL_LABEL } from "@/content/communities";
import { getCommunity } from "@/lib/communityGraph";
import { bracketProblem, detectSlots, newCustomPlayId } from "@/lib/customPlays/model";
import { customPlayRepository } from "@/lib/customPlays/repository";
import { CUSTOM_PLAY_SCHEMA_VERSION, type CustomPlay, type PlayAuthor } from "@/lib/customPlays/types";
import { getPlatformIdentity } from "@/lib/platformIdentity";

type FieldId = "title" | "communityId" | "category" | "persona" | "task" | "format";

interface Draft {
  title: string;
  communityId: string;
  category: string;
  situation: string;
  persona: string;
  task: string;
  format: string;
  verify: string[];
  neverPaste: string;
  longAnswerSlots: string[];
}

const EMPTY_DRAFT: Draft = {
  title: "",
  communityId: "",
  category: "",
  situation: "",
  persona: "",
  task: "",
  format: "",
  verify: [""],
  neverPaste: "",
  longAnswerSlots: [],
};

const FIELD_LABEL: Record<FieldId, string> = {
  title: "Play title",
  communityId: "Community",
  category: "Category",
  persona: "Who the AI is",
  task: "The job",
  format: "What comes back",
};

const INPUT =
  "mt-1 w-full rounded-input border border-silver-mid bg-white px-3 py-2 text-sm text-primary-dark placeholder:text-gray-400 focus:outline-none focus:border-primary aria-[invalid=true]:border-af-red";

function currentAuthor(): PlayAuthor {
  const identity = getPlatformIdentity();
  return identity
    ? { kind: "account", displayName: identity.username, email: identity.email, afsc: identity.afsc, rank: identity.rank }
    : { kind: "device", displayName: "You" };
}

function Field({
  id,
  label,
  required,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-[0.16em] text-primary-dark">
        {label}
        {required ? <span className="ml-1.5 normal-case tracking-normal font-semibold text-silver">(required)</span> : <span className="ml-1.5 normal-case tracking-normal font-semibold text-silver">(optional)</span>}
      </label>
      {help && <p id={`${id}-help`} className="mt-0.5 text-[11px] text-gray-500">{help}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-af-red">
          <CircleAlert size={12} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, help: boolean, error?: string): string {
  return [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || "";
}

// Create or edit a play saved on this device. `?community=<id>` pre-selects a community;
// `?edit=<playId>` loads an existing custom play.
export default function PlayForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [existing, setExisting] = useState<CustomPlay | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing">("loading");
  const [errors, setErrors] = useState<Partial<Record<FieldId, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showCaution, setShowCaution] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const verifyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusVerify = useRef<number | null>(null);
  const addCheckRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    const community = params.get("community") ?? "";
    if (!editId) {
      Promise.resolve().then(() => {
        setDraft((d) => ({ ...d, communityId: getCommunity(community) ? community : "" }));
        setLoadState("ready");
      });
      return;
    }
    customPlayRepository.get(editId).then((play) => {
      if (!play) {
        setLoadState("missing");
        return;
      }
      setExisting(play);
      setDraft({
        title: play.title,
        communityId: play.communityId,
        category: play.category,
        situation: play.situation ?? "",
        persona: play.persona,
        task: play.task,
        format: play.format,
        verify: play.verify.length > 0 ? play.verify : [""],
        neverPaste: play.neverPaste ?? "",
        longAnswerSlots: play.longAnswerSlots,
      });
      setShowCaution(Boolean(play.neverPaste));
      setLoadState("ready");
    });
  }, []);

  useEffect(() => {
    if (focusVerify.current === null) return;
    verifyRefs.current[focusVerify.current]?.focus();
    focusVerify.current = null;
  }, [draft.verify.length]);

  const slots = useMemo(() => detectSlots(draft.persona, draft.task, draft.format), [draft.persona, draft.task, draft.format]);
  const preview = [draft.persona, draft.task, draft.format].map((part) => part.trim()).filter(Boolean).join("\n\n");
  const communityName = getCommunity(draft.communityId)?.name;

  const validate = (d: Draft): Partial<Record<FieldId, string>> => {
    const next: Partial<Record<FieldId, string>> = {};
    if (!d.title.trim()) next.title = "Give the play a title.";
    if (!getCommunity(d.communityId)) next.communityId = "Choose the community this play is for.";
    if (!PLAY_CATEGORIES.some((c) => c.id === d.category)) next.category = "Choose a category.";
    if (!d.persona.trim()) next.persona = "Tell the AI what role to play.";
    if (!d.task.trim()) next.task = "Say what the AI should do.";
    if (!d.format.trim()) next.format = "Say how the answer should look.";
    for (const field of ["persona", "task", "format"] as const) {
      const problem = bracketProblem(d[field]);
      if (problem && !next[field]) next[field] = problem;
    }
    return next;
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    const next = { ...draft, [key]: value };
    setDirty(true);
    setDraft(next);
    if (submitted) setErrors(validate(next));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const found = validate(draft);
    if (!found.title && draft.title.trim()) {
      const others = await customPlayRepository.list();
      const clash = others.some(
        (p) => p.id !== existing?.id && p.communityId === draft.communityId && p.title.trim().toLowerCase() === draft.title.trim().toLowerCase(),
      );
      if (clash) found.title = "You already have a play with this title in this community.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const slotKeys = new Set(slots.map((s) => s.key));
    const play: CustomPlay = {
      id: existing?.id ?? newCustomPlayId(),
      schemaVersion: CUSTOM_PLAY_SCHEMA_VERSION,
      origin: "custom",
      communityId: draft.communityId,
      status: existing?.status ?? "draft",
      author: existing?.author ?? currentAuthor(),
      review: existing?.review,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      title: draft.title.trim(),
      situation: draft.situation.trim() || undefined,
      category: draft.category,
      level: PLAY_CATEGORIES.find((c) => c.id === draft.category)?.level ?? 1,
      persona: draft.persona.trim(),
      task: draft.task.trim(),
      format: draft.format.trim(),
      verify: draft.verify.map((v) => v.trim()).filter(Boolean),
      neverPaste: draft.neverPaste.trim() || undefined,
      longAnswerSlots: draft.longAnswerSlots.filter((key) => slotKeys.has(key)),
    };
    try {
      await customPlayRepository.save(play);
      router.push(`/communities/${play.communityId}?tab=airmen#${play.id}`);
    } catch {
      setSaving(false);
      setErrors({ title: "Couldn't save on this device. Your browser storage may be full or turned off." });
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  };

  const backHref = existing
    ? `/communities/${existing.communityId}?tab=airmen`
    : draft.communityId
      ? `/communities/${draft.communityId}?tab=airmen`
      : "/communities";

  const cancel = () => {
    if (dirty && !window.confirm("Discard changes?")) return;
    router.push(backHref);
  };

  const remove = async () => {
    if (!existing) return;
    await customPlayRepository.remove(existing.id);
    router.push(`/communities/${existing.communityId}?tab=airmen`);
  };

  const setVerify = (index: number, value: string) => update("verify", draft.verify.map((v, i) => (i === index ? value : v)));
  const addVerify = (after = draft.verify.length - 1) => {
    focusVerify.current = after + 1;
    update("verify", [...draft.verify.slice(0, after + 1), "", ...draft.verify.slice(after + 1)]);
  };
  const removeVerify = (index: number) => {
    const next = draft.verify.filter((_, i) => i !== index);
    update("verify", next);
    if (index > 0) requestAnimationFrame(() => verifyRefs.current[index - 1]?.focus());
    else requestAnimationFrame(() => addCheckRef.current?.focus());
  };

  const toggleLongAnswer = (key: string, on: boolean) =>
    update("longAnswerSlots", on ? [...draft.longAnswerSlots, key] : draft.longAnswerSlots.filter((k) => k !== key));

  const errorEntries = Object.entries(errors) as [FieldId, string][];
  const heroTitle = existing ? "Edit play" : "Build a play";

  return (
    <div className="editorial-page bleed flex flex-col">
      <PageHero eyebrow={existing ? "Your play" : "Create a play"} title={heroTitle}>
        {communityName && <p>For {communityName}.</p>}
        <p className="flex items-center gap-1.5">
          <Lock size={14} aria-hidden="true" className="flex-shrink-0" /> Saved on this device only. Nothing is uploaded or shared.
        </p>
      </PageHero>

      <div className="pt-5 pb-10">
        {loadState === "loading" && <p className="text-xs text-gray-500">Loading…</p>}

        {loadState === "missing" && (
          <div className="rounded-card border border-dashed border-silver-mid/70 bg-white p-4">
            <p className="font-editorial text-lg font-semibold text-primary-dark">That play isn&apos;t on this device.</p>
            <Link href="/communities" className="mt-2 inline-flex min-h-11 items-center text-xs font-bold text-primary underline underline-offset-2">
              Back to Communities
            </Link>
          </div>
        )}

        {loadState === "ready" && (
          <form noValidate onSubmit={save} className="grid gap-8 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              {errorEntries.length > 0 && (
                <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-r-inner border-l-[3px] border-af-red bg-white px-3 py-2.5 focus:outline-none">
                  <p className="text-xs font-bold text-af-red">Fix {errorEntries.length === 1 ? "this" : "these"} before saving:</p>
                  <ul className="mt-1 list-disc pl-5 text-xs text-primary-dark">
                    {errorEntries.map(([field, message]) => (
                      <li key={field}>
                        <a href={`#play-${field}`} className="underline underline-offset-2">{FIELD_LABEL[field]}: {message}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Field id="play-title" label="Play title" required help="Name the job. Example: Draft an award bullet." error={errors.title}>
                <input
                  id="play-title"
                  value={draft.title}
                  maxLength={80}
                  onChange={(e) => update("title", e.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={describedBy("play-title", true, errors.title)}
                  className={INPUT}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="play-communityId" label="Community" required error={errors.communityId}>
                  <select
                    id="play-communityId"
                    value={draft.communityId}
                    onChange={(e) => update("communityId", e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.communityId)}
                    aria-describedby={describedBy("play-communityId", false, errors.communityId)}
                    className={INPUT}
                  >
                    <option value="">Choose a community</option>
                    {COMMUNITIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({COMMUNITY_LEVEL_LABEL[c.level]})</option>
                    ))}
                  </select>
                </Field>
                <Field id="play-category" label="Category" required error={errors.category}>
                  <select
                    id="play-category"
                    value={draft.category}
                    onChange={(e) => update("category", e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.category)}
                    aria-describedby={describedBy("play-category", false, errors.category)}
                    className={INPUT}
                  >
                    <option value="">Choose a category</option>
                    {PLAY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </Field>
              </div>

              <Field id="play-situation" label="What's the situation?" help="When would an Airman reach for this? Example: I need a bullet for a quarterly award.">
                <input
                  id="play-situation"
                  value={draft.situation}
                  onChange={(e) => update("situation", e.target.value)}
                  aria-describedby="play-situation-help"
                  className={INPUT}
                />
              </Field>

              <Field id="play-persona" label="Who the AI is" required help="Tell the AI what role to play. Example: You are an experienced first sergeant." error={errors.persona}>
                <textarea
                  id="play-persona"
                  rows={2}
                  value={draft.persona}
                  onChange={(e) => update("persona", e.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.persona)}
                  aria-describedby={describedBy("play-persona", true, errors.persona)}
                  className={`${INPUT} resize-y`}
                />
              </Field>

              <Field id="play-task" label="The job" required help="What should it do? Put [BRACKETS] anywhere you want to type something in each time, like [ACCOMPLISHMENT]." error={errors.task}>
                <textarea
                  id="play-task"
                  rows={5}
                  value={draft.task}
                  onChange={(e) => update("task", e.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.task)}
                  aria-describedby={describedBy("play-task", true, errors.task)}
                  className={`${INPUT} resize-y`}
                />
              </Field>

              <fieldset className="rounded-inner border border-silver-mid/60 bg-primary-ghost px-3 py-3">
                <legend className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-dark">What you feed it</legend>
                <p aria-live="polite" className="text-[11px] text-gray-600">
                  {slots.length === 0
                    ? "No fill-in boxes. This play will run exactly as written. Add [BRACKETS] to create them."
                    : `Detected ${slots.length} fill-in ${slots.length === 1 ? "box" : "boxes"} from your [BRACKETS].`}
                </p>
                {slots.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {slots.map((slot) => (
                      <li key={slot.key} className="flex flex-wrap items-center justify-between gap-2 rounded-inner border border-silver-mid/60 bg-white px-2.5 py-1.5">
                        <span className="text-xs font-semibold text-primary-dark">{slot.label}</span>
                        <label className="flex min-h-9 items-center gap-1.5 text-[11px] text-gray-600">
                          <input
                            type="checkbox"
                            checked={draft.longAnswerSlots.includes(slot.key)}
                            onChange={(e) => toggleLongAnswer(slot.key, e.target.checked)}
                            className="accent-[color:var(--color-primary-dark)]"
                          />
                          Long answer
                          <span className="sr-only"> for {slot.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </fieldset>

              <Field id="play-format" label="What comes back" required help="Say how the answer should look. Example: Three bullets, 25 words each." error={errors.format}>
                <textarea
                  id="play-format"
                  rows={3}
                  value={draft.format}
                  onChange={(e) => update("format", e.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.format)}
                  aria-describedby={describedBy("play-format", true, errors.format)}
                  className={`${INPUT} resize-y`}
                />
              </Field>

              <fieldset>
                <legend className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-dark">
                  Prove it <span className="ml-1.5 normal-case tracking-normal font-semibold text-silver">(optional)</span>
                </legend>
                <p className="mt-0.5 text-[11px] text-gray-500">What should you check before you use the answer? Example: Names and dates are correct.</p>
                <ul className="mt-1 flex flex-col gap-1.5">
                  {draft.verify.map((item, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                      <input
                        ref={(node) => { verifyRefs.current[index] = node; }}
                        value={item}
                        aria-label={`Check ${index + 1} of ${draft.verify.length}`}
                        onChange={(e) => setVerify(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addVerify(index);
                          }
                        }}
                        className={`${INPUT} mt-0`}
                      />
                      <button
                        type="button"
                        onClick={() => removeVerify(index)}
                        aria-label={`Remove check ${index + 1}`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center text-silver hover:text-af-red"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  ref={addCheckRef}
                  type="button"
                  onClick={() => addVerify()}
                  className="mt-1 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-primary"
                >
                  <Plus size={14} aria-hidden="true" /> Add a check
                </button>
              </fieldset>

              {showCaution ? (
                <Field id="play-neverPaste" label="Never paste" help="A caution shown in red on the play. Example: Don't paste CUI, PII, or classified information.">
                  <input
                    id="play-neverPaste"
                    value={draft.neverPaste}
                    onChange={(e) => update("neverPaste", e.target.value)}
                    aria-describedby="play-neverPaste-help"
                    className={INPUT}
                  />
                </Field>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCaution(true)}
                  className="self-start inline-flex min-h-11 items-center gap-1 text-xs font-bold text-primary"
                >
                  <Plus size={14} aria-hidden="true" /> Add a caution
                </button>
              )}

              <div className="sticky bottom-0 lg:static -mx-1 flex flex-wrap items-center gap-2 border-t border-silver-mid/60 bg-surface px-1 py-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-inner bg-primary-dark px-4 text-sm font-bold text-white hover:bg-primary disabled:opacity-60"
                >
                  <Save size={15} aria-hidden="true" /> Save play
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="inline-flex min-h-11 items-center rounded-inner border border-primary-dark bg-white px-4 text-sm font-bold text-primary-dark hover:bg-primary-ghost"
                >
                  Cancel
                </button>
                {existing && (
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {confirmDelete ? (
                      <div role="group" aria-label="Confirm delete" className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-primary-dark">Delete this play from this device? This can&apos;t be undone.</span>
                        <button type="button" onClick={remove} className="min-h-11 rounded-inner bg-af-red px-3 text-xs font-bold text-white">Delete</button>
                        <button type="button" autoFocus onClick={() => setConfirmDelete(false)} className="min-h-11 rounded-inner border border-primary-dark px-3 text-xs font-bold text-primary-dark">Keep</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-af-red">
                        <Trash2 size={14} aria-hidden="true" /> Delete play
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <aside aria-label="Prompt preview" className="lg:sticky lg:top-4 self-start">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-warm-dark">Preview</p>
              <h2 className="font-editorial text-lg font-semibold text-primary-dark leading-snug mt-1">{draft.title.trim() || "Untitled play"}</h2>
              {draft.situation.trim() && <p className="mt-1 text-xs text-gray-500">{draft.situation}</p>}
              <pre className="mt-3 rounded-inner bg-primary-deeper text-on-dark text-[11px] leading-relaxed whitespace-pre-wrap font-mono px-3 py-3 min-h-32 max-h-[28rem] overflow-y-auto">
                {preview || "Your prompt appears here as you write it."}
              </pre>
              <p className="mt-2 text-[11px] text-gray-500">
                Each [BRACKET] becomes a fill-in box on the play card. Anything left blank stays as the bracket text.
              </p>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
