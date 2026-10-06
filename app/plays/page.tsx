"use client";

import { useMemo, useState } from "react";
import { Lightbulb, ExternalLink, TrendingUp } from "lucide-react";
import { PLAYS } from "@/content/plays";
import { PLAY_CATEGORIES } from "@/content/categories";
import { SUGGEST_PLAY_FORM_URL } from "@/lib/links";
import PlayCard2 from "@/components/PlayCard2";
import PlatformFeedTabs from "@/components/PlatformFeedTabs";
import CommunitySubmissionFeed from "@/components/CommunitySubmissionFeed";
import { FEATURES } from "@/lib/features";
import PageHero from "@/components/PageHero";
import type { PlatformFeedSort } from "@/lib/platformFeed";

export default function PlaysPage() {
  const [feedSort, setFeedSort] = useState<PlatformFeedSort>("core");
  const groups = useMemo(
    () =>
      PLAY_CATEGORIES.map((category) => ({
        category,
        plays: PLAYS.filter((p) => p.category === category.id),
      })).filter((g) => g.plays.length > 0),
    [],
  );

  return (
    <div className="editorial-page bleed flex flex-col">
      <PageHero eyebrow="Mission execution" title="Plays" photo="airman-laptop" position="60% 14%">
        <p>
          Every play shows you its moving parts — who the AI is, the job, what you feed it, what comes back, and how
          you prove it. Fill it in, run it, and check it before your name goes on it.
        </p>
      </PageHero>

      {FEATURES.platformDiscoveryFeeds && (
        <PlatformFeedTabs value={feedSort} onChange={setFeedSort} label="Sort plays" />
      )}

      {feedSort === "core" || !FEATURES.platformDiscoveryFeeds ? (
      <>
      {/* Scope note */}
      <div className="pt-4">
        <p className="text-xs text-gray-500 font-medium leading-snug">
          v1 ships {PLAYS.length} deep, framework-grade plays that work for any Airman, E-1 through E-7. Tap a card to
          open its anatomy.
        </p>
      </div>

      {/* Category sections */}
      <div className="pt-4 flex flex-col gap-6 pb-4">
        {groups.map(({ category, plays }) => (
          <section key={category.id}>
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-primary-dark uppercase tracking-wider">{category.label}</h2>
                {category.level === 3 && (
                  <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-badge bg-tech-tint text-tech-dim uppercase tracking-wide">
                    <TrendingUp size={9} /> Level 3
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{category.blurb}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {plays.map((play) => (
                <PlayCard2 key={play.id} play={play} />
              ))}
            </div>
          </section>
        ))}

        {/* Suggest a play — SME contribution door */}
        {/* FLAGGED: suggest-a-play placement + wording pending product-owner adjudication (Doctrine appendix). */}
        {SUGGEST_PLAY_FORM_URL ? (
          <a
            href={SUGGEST_PLAY_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-card bg-white border border-primary/30 shadow-resting active:bg-primary/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-inner bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={18} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-primary-dark leading-tight">Suggest a play</p>
              <p className="text-xs text-gray-500 leading-snug">Know a task AI could speed up? Propose it for the shelf.</p>
            </div>
            <ExternalLink size={16} className="flex-shrink-0 text-primary/60" />
          </a>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-card bg-white border border-silver-mid/40 shadow-resting">
            <div className="w-9 h-9 rounded-inner bg-silver-tint flex items-center justify-center flex-shrink-0">
              <Lightbulb size={18} className="text-silver" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-primary-dark leading-tight">Suggest a play</p>
              <p className="text-xs text-gray-500 leading-snug">Contribution form opening soon.</p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-badge bg-gray-100 text-gray-500 flex-shrink-0">
              Coming soon
            </span>
          </div>
        )}

        <p className="text-[10px] text-gray-400 text-center leading-relaxed px-4 pt-1 pb-2">
          Plays are examples for a concept demonstration. Time figures are self-reported estimates. Check every draft
          before your name goes on it.
        </p>
      </div>
      </>
      ) : (
        <CommunitySubmissionFeed kind="play" sort={feedSort} />
      )}
    </div>
  );
}
