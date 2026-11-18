"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown, ChevronUp, Copy, Check, Zap, Clock, ShieldAlert,
  ArrowUpRight, Info, PanelRightOpen, Plug, TrendingUp, Award, Lock,
} from "lucide-react";
import { assemblePrompt, type ContentItem } from "@/content/schema";
import { categoryLabel } from "@/content/categories";
import { markPlayRun } from "@/lib/favorites";
import StarToggle from "@/components/StarToggle";
import ResponsiveDetailPanel from "@/components/ResponsiveDetailPanel";
import ReportAccessButton from "@/components/ReportAccessButton";
import { communitiesForPlay, playHref } from "@/lib/communityGraph";

// ─── The five anatomy segments ────────────────────────────────────────────────
// A single tonal navy/slate scale (plus brand red for the final check) so the
// anatomy reads as one editorial system rather than a rainbow of status colors.
const SEGMENTS = [
  { key: "persona", label: "WHO THE AI IS", color: "var(--color-primary-dark)" },
  { key: "task", label: "THE JOB", color: "var(--color-primary)" },
  { key: "feed", label: "WHAT YOU FEED IT", color: "var(--color-primary-muted)" },
  { key: "format", label: "WHAT COMES BACK", color: "var(--color-tech-dim)" },
  { key: "verify", label: "PROVE IT", color: "var(--color-af-red)" },
] as const;

function ConnectorChips({ connectors }: { connectors: string[] }) {
  if (connectors.length === 0) return null;
  return (
    <>
      {connectors.map((c) => (
        <span
          key={c}
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-badge bg-tech-tint text-tech-dim border border-tech/30"
        >
          <Plug size={9} /> {c}
        </span>
      ))}
    </>
  );
}

// One anatomy segment: a colored, tappable label bar reveals the plain-language
// "why"; the body renders the segment's content (text, inputs, or checkboxes).
function Segment({
  color,
  label,
  why,
  children,
}: {
  color: string;
  label: string;
  why?: string;
  children: React.ReactNode;
}) {
  const [showWhy, setShowWhy] = useState(false);
  return (
    <div
      className="rounded-inner overflow-hidden border border-silver-mid/60 border-l-[3px] mb-2 bg-white"
      style={{ borderLeftColor: color }}
    >
      <button
        type="button"
        onClick={() => why && setShowWhy((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-left bg-primary-ghost border-b border-silver-mid/60"
        aria-expanded={why ? showWhy : undefined}
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color }}>{label}</span>
        {why && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-silver flex items-center gap-0.5">
            <Info size={10} /> why
          </span>
        )}
      </button>
      {why && showWhy && (
        <p className="text-[11px] leading-snug text-primary-dark px-3 py-2 bg-warm-tint/60 border-b border-warm/40">
          <span className="font-bold text-warm-dark">WHY: </span>
          {why}
        </p>
      )}
      <div className="text-xs leading-relaxed text-gray-700 px-3 py-2.5 bg-white">{children}</div>
    </div>
  );
}

// `communityId` is the community the card is shown in. Plays open inside a community, so saved
// items and report links point back to it, and the card lists every other community it is in.
export default function PlayCard2({ play, communityId }: { play: ContentItem; communityId?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [assembled, setAssembled] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showProv, setShowProv] = useState(false);

  const seg = play.body_segments;
  const why = play.segment_why ?? {};

  const handleAssemble = () => setAssembled(assemblePrompt(play, values));

  const handleCopy = async () => {
    const text = assembled ?? assemblePrompt(play, values);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard blocked — the assembled text is on screen to copy by hand */
    }
    markPlayRun(play.id); // lightweight "this play was used" signal (device-local)
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runOn = play.run_on;
  const playUrl = playHref(play.id, communityId);
  const otherCommunities = communitiesForPlay(play.id).filter((community) => community.id !== communityId);

  return (
    // id anchor: search results and tool cards deep-link here as /communities/<id>#<playId>
    <div id={play.id} className="scroll-mt-4 rounded-card shadow-resting overflow-hidden bg-surface border border-silver-mid border-t-2 border-t-primary-dark transition-all duration-base ease-smooth hover:shadow-hover hover:border-primary/40 hover:border-t-primary-dark">
      {/* ── Collapsed header ── */}
      <div className="flex items-start gap-2 p-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 min-w-0 text-left"
          aria-expanded={expanded}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-warm-dark">{categoryLabel(play.category)}</p>
          <h3 className="font-editorial text-lg font-semibold text-primary-dark leading-snug mt-1">{play.title}</h3>
          {play.situation && (
            <p className="text-xs text-gray-500 leading-snug mt-1">{play.situation}</p>
          )}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-badge bg-primary-ghost text-primary border border-primary/25">
              {play.level === 3 ? <><TrendingUp size={9} /> Level 3</> : `Level ${play.level ?? 1}`}
            </span>
            {play.time_back && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-badge bg-silver-tint text-silver border border-silver-mid">
                <Clock size={9} /> {play.time_back}
              </span>
            )}
            <ConnectorChips connectors={play.connectors} />
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-badge bg-warm-tint text-warm-dark border border-warm/60">
              <Award size={9} aria-hidden="true" className="text-primary-dark" /> Battle-tested
            </span>
          </div>
        </button>

        <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1.5">
          <StarToggle item={{ type: "play", id: play.id, title: play.title, url: playUrl }} />
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Collapse play" : "Expand play"}
            aria-expanded={expanded}
            className="p-1.5 text-silver hover:text-primary transition-colors"
          >
            <span className="lg:hidden">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <PanelRightOpen size={16} className="hidden lg:block" />
          </button>
        </div>
      </div>

      {otherCommunities.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 mx-4 py-3 border-t border-silver-mid/60 text-[10px] font-bold uppercase tracking-[0.16em] text-silver">
          <span>{communityId ? "Also in" : "In"}</span>
          {otherCommunities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.id}#${play.id}`}
              className="rounded-badge border border-primary/30 px-2 py-1 text-[10px] font-semibold normal-case tracking-normal text-primary hover:bg-primary-ghost"
            >
              {community.name}
            </Link>
          ))}
        </p>
      )}

      {/* ── Expanded body ── */}
      {expanded && seg && (
        <ResponsiveDetailPanel
          open={expanded}
          onClose={() => setExpanded(false)}
          title={play.title}
          eyebrow={categoryLabel(play.category)}
        >
        <div className="px-4 pb-4 border-t border-silver-mid/40 lg:px-6">
          {/* Sensitive plays: CUI caution + disclaimer up top */}
          {play.sensitive && (
            <div className="mt-3 flex items-start gap-2 rounded-r-inner border-l-[3px] border-warm-dark bg-warm-tint px-3 py-2.5">
              <ShieldAlert size={15} className="flex-shrink-0 mt-0.5 text-warm-dark" />
              <p className="text-[11px] font-semibold text-primary-dark leading-snug">
                Higher-sensitivity play. This structures your writing — it is not legal advice. The Area Defense
                Counsel is free, confidential, and outside your chain; seeing them first is always fair.
              </p>
            </div>
          )}

          {/* 1 · Contract line */}
          {play.contract && (
            <div className="mt-3 rounded-r-inner border-l-[3px] border-primary bg-primary-ghost px-3 py-2">
              <p className="text-[11px] text-primary-dark leading-snug">
                <span className="font-bold text-primary">You walk away with: </span>
                {play.contract.replace(/^You walk away with:\s*/i, "")}
              </p>
            </div>
          )}

          {/* 2 · Anatomy segments */}
          <div className="mt-3">
            <Segment color={SEGMENTS[0].color} label={SEGMENTS[0].label} why={why.persona}>
              {seg.persona}
            </Segment>
            <Segment color={SEGMENTS[1].color} label={SEGMENTS[1].label} why={why.task}>
              {seg.task}
            </Segment>

            {/* 3 · FEED — real, device-local inputs */}
            <Segment color={SEGMENTS[2].color} label={SEGMENTS[2].label} why={why.feed}>
              <div className="flex flex-col gap-2">
                {seg.feed_slots.map((slot) => (
                  <label key={slot.key} className="block">
                    <span className="text-[10px] font-semibold text-primary-muted">{slot.label}</span>
                    {slot.multiline ? (
                      <textarea
                        value={values[slot.key] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [slot.key]: e.target.value }))}
                        placeholder={slot.placeholder}
                        rows={2}
                        className="mt-1 w-full rounded-input border border-dashed border-primary-muted/50 bg-primary-ghost px-2.5 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-solid focus:border-primary focus:bg-white resize-y"
                      />
                    ) : (
                      <input
                        value={values[slot.key] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [slot.key]: e.target.value }))}
                        placeholder={slot.placeholder}
                        className="mt-1 w-full rounded-input border border-dashed border-primary-muted/50 bg-primary-ghost px-2.5 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-solid focus:border-primary focus:bg-white"
                      />
                    )}
                  </label>
                ))}
                <p className="text-[10px] font-semibold text-silver flex items-center gap-1">
                  <Lock size={10} aria-hidden="true" className="text-primary-dark" /> Nothing you type leaves this phone.
                </p>
              </div>
            </Segment>

            <Segment color={SEGMENTS[3].color} label={SEGMENTS[3].label} why={why.format}>
              {seg.format}
            </Segment>

            {/* PROVE IT — the Airman's own checklist (local, not part of the prompt) */}
            <Segment color={SEGMENTS[4].color} label={SEGMENTS[4].label}>
              <div className="flex flex-col gap-1.5">
                {seg.verify.map((item, idx) => (
                  <label key={idx} className="flex items-start gap-2 text-[11px] text-gray-700 leading-snug cursor-pointer">
                    <input type="checkbox" className="mt-0.5 accent-[color:var(--color-af-red)]" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </Segment>
          </div>

          <div className="mt-4 flex justify-end border-t border-silver-mid/50 pt-2">
            <ReportAccessButton targetType="play" targetId={play.id} targetTitle={play.title} targetUrl={playUrl} />
          </div>

          {/* 4 · See the whole play → assemble verbatim + copy */}
          <button
            onClick={handleAssemble}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-inner text-sm font-bold bg-primary-dark text-white hover:bg-primary active:bg-primary-deeper transition-colors"
          >
            <Zap size={15} /> See the whole play
          </button>
          {assembled && (
            <>
              <pre className="mt-2 rounded-inner bg-primary-deeper text-on-dark text-[11px] leading-relaxed whitespace-pre-wrap font-mono px-3 py-3 max-h-64 overflow-y-auto">
                {assembled}
              </pre>
              <button
                onClick={handleCopy}
                className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-inner text-sm font-bold transition-colors ${
                  copied ? "bg-tech-dim text-white" : "bg-white text-primary-dark border border-primary-dark hover:bg-primary-ghost active:bg-primary-tint"
                }`}
              >
                {copied ? <><Check size={15} /> Copied — go run it</> : <><Copy size={15} /> Copy the play</>}
              </button>
            </>
          )}

          {/* 5 · Where to run it + connector setup */}
          {runOn && (
            <div className="mt-3 rounded-r-inner border-l-[3px] border-tech-dim bg-tech-tint px-3 py-2.5">
              <p className="text-[11px] text-primary-dark leading-snug">
                <span className="font-bold text-tech-dim">Run it: </span>
                {runOn.surfaces.join(" · ")}
                {runOn.connector_note ? ` — ${runOn.connector_note}` : ""}
              </p>
            </div>
          )}

          {/* 6 · Never-paste bar */}
          {play.never_paste && (
            <div className="mt-3 flex items-start gap-2 rounded-r-inner border-l-[3px] border-af-red bg-white border-y border-r border-y-silver-mid/60 border-r-silver-mid/60 px-3 py-2.5">
              <ShieldAlert size={15} className="flex-shrink-0 mt-0.5 text-af-red" />
              <p className="text-[11px] font-semibold text-af-red leading-snug">{play.never_paste}</p>
            </div>
          )}

          {/* 8 · Deeper bridge link(s) */}
          {play.deeper_links?.map((d) => (
            <div key={d.label} className="mt-3 rounded-inner bg-primary-ghost border border-silver-mid px-3 py-2.5">
              <p className="text-[11px] font-bold text-primary flex items-center gap-1">
                <ArrowUpRight size={13} /> {d.label}
              </p>
              {d.note && <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{d.note}</p>}
            </div>
          ))}

          {/* 9 · Provenance drawer */}
          <button
            onClick={() => setShowProv((v) => !v)}
            className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-silver hover:text-primary flex items-center gap-1"
            aria-expanded={showProv}
          >
            <Info size={11} /> Where this play comes from
          </button>
          {showProv && (
            <p className="mt-1.5 rounded-inner bg-warm-tint/50 border border-warm/40 px-3 py-2.5 text-[11px] text-gray-600 leading-snug">
              Adapted from open prompt frameworks proven by tens of thousands of practitioners, plus the community
              workflows Airmen already trust — rebuilt to current guidance and verified 14 Jul 2026. The app shows
              its work; it never asserts authorization or mirrors official document text.
            </p>
          )}
        </div>
        </ResponsiveDetailPanel>
      )}
    </div>
  );
}
