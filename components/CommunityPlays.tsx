"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Lock, Plus, Users } from "lucide-react";
import PlayCard2 from "@/components/PlayCard2";
import type { ContentItem } from "@/content/schema";
import { getCommunity } from "@/lib/communityGraph";
import { customPlayRepository } from "@/lib/customPlays/repository";
import { customPlayToContentItem } from "@/lib/customPlays/model";
import { useCustomPlays } from "@/lib/customPlays/useCustomPlays";

type TabId = "playbook" | "airmen";
const TAB_PARAM: Record<TabId, string> = { playbook: "", airmen: "airmen" };

export function createPlayHref(communityId: string): string {
  return `/plays/new?community=${encodeURIComponent(communityId)}`;
}

function readTabFromUrl(): TabId {
  return new URLSearchParams(window.location.search).get("tab") === "airmen" ? "airmen" : "playbook";
}

// "Plays in this community": reviewed Playbook plays, and plays created by Airmen. Today the
// second tab holds only the plays this Airman saved on this device; approved plays from other
// Airmen join it once the publish-and-review flow ships.
export default function CommunityPlays({
  communityId,
  communityName,
  plays,
  hasInherited,
}: {
  communityId: string;
  communityName: string;
  plays: ContentItem[];
  hasInherited: boolean;
}) {
  const [tab, setTab] = useState<TabId>("playbook");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ playbook: null, airmen: null });
  const { plays: customPlays, ready } = useCustomPlays();

  useEffect(() => {
    const fromUrl = readTabFromUrl();
    if (fromUrl !== "playbook") setTab(fromUrl);
  }, []);

  const mine = customPlays.filter((play) => play.communityId === communityId);
  const elsewhere = customPlays.filter((play) => play.communityId !== communityId);
  const createHref = createPlayHref(communityId);

  const tabs: { id: TabId; label: string; count: number | null }[] = [
    { id: "playbook", label: "Playbook", count: plays.length },
    { id: "airmen", label: "Created by Airmen", count: ready ? mine.length : null },
  ];

  const select = (next: TabId, focus = false) => {
    setTab(next);
    const url = new URL(window.location.href);
    if (TAB_PARAM[next]) url.searchParams.set("tab", TAB_PARAM[next]);
    else url.searchParams.delete("tab");
    window.history.replaceState(window.history.state, "", url);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.findIndex((t) => t.id === tab);
    const last = tabs.length - 1;
    const target =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    select(tabs[target].id, true);
  };

  const elsewhereByCommunity = [...new Set(elsewhere.map((play) => play.communityId))].map((id) => ({
    id,
    name: getCommunity(id)?.name ?? id,
    count: elsewhere.filter((play) => play.communityId === id).length,
  }));

  return (
    <section aria-labelledby="plays-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="plays-title" className="text-xs font-bold uppercase tracking-wider text-primary-dark">Plays in this community</h2>
        <Link
          href={createHref}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-inner border border-primary-dark bg-white px-3 text-xs font-bold text-primary-dark hover:bg-primary-ghost"
        >
          <Plus size={14} aria-hidden="true" /> Create a play
        </Link>
      </div>

      <div role="tablist" aria-label="Plays in this community" className="mt-2 flex gap-4 border-b border-silver-mid/60">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              ref={(node) => { tabRefs.current[t.id] = node; }}
              id={`plays-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`plays-panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={onTabKey}
              className={`-mb-px inline-flex min-h-11 items-center gap-1.5 border-b-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                active ? "border-primary-dark text-primary-dark" : "border-transparent text-silver hover:text-primary"
              }`}
            >
              {t.label}
              {t.count !== null && <span aria-label={`, ${t.count}`} className="font-semibold tabular-nums">· {t.count}</span>}
            </button>
          );
        })}
      </div>

      {tab === "playbook" ? (
        <div id="plays-panel-playbook" role="tabpanel" aria-labelledby="plays-tab-playbook" tabIndex={0} className="pt-3 focus:outline-none">
          <p className="text-xs text-gray-600">Reviewed plays from the Playbook.</p>
          {plays.length > 0 ? (
            <div className="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {plays.map((play) => <PlayCard2 key={play.id} play={play} communityId={communityId} />)}
            </div>
          ) : (
            <p className="mt-2 rounded-card border border-dashed border-silver-mid/70 bg-white p-4 text-xs text-gray-600">
              No plays have been added to {communityName} yet.
              {hasInherited ? " Plays from broader communities are listed below." : ""}
              {mine.length > 0 && (
                <>
                  {" "}You have {mine.length} {mine.length === 1 ? "play" : "plays"} of your own.{" "}
                  <button type="button" onClick={() => select("airmen", true)} className="font-semibold text-primary underline underline-offset-2">
                    See Created by Airmen
                  </button>
                </>
              )}
            </p>
          )}
          <p className="mt-3 text-[11px] text-gray-500">
            Time figures are self-reported estimates. Check every draft before your name goes on it.
          </p>
        </div>
      ) : (
        <div id="plays-panel-airmen" role="tabpanel" aria-labelledby="plays-tab-airmen" tabIndex={0} className="pt-3 flex flex-col gap-6 focus:outline-none">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-warm-dark">Your plays</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
              <Lock size={12} aria-hidden="true" className="flex-shrink-0 text-primary-dark" />
              Saved on this device only. Clearing your browser data removes them.
            </p>
            {!ready ? (
              <p className="mt-2 text-xs text-gray-500">Loading your plays…</p>
            ) : mine.length > 0 ? (
              <div className="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {mine.map((play) => (
                  <PlayCard2
                    key={play.id}
                    play={customPlayToContentItem(play)}
                    communityId={communityId}
                    custom={{
                      status: play.status,
                      authorName: "You",
                      updatedAt: play.updatedAt,
                      editHref: `/plays/new?edit=${encodeURIComponent(play.id)}`,
                      onDelete: () => {
                        void customPlayRepository.remove(play.id).then(() => tabRefs.current.airmen?.focus());
                      },
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-card border border-dashed border-silver-mid/70 bg-white p-4">
                {elsewhere.length === 0 ? (
                  <>
                    <p className="font-editorial text-lg font-semibold text-primary-dark">You haven&apos;t made a play yet.</p>
                    <p className="mt-1 text-xs text-gray-600">
                      A play is a prompt you can reuse. Write it once, fill in the blanks each time. It&apos;s saved on this device only.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-editorial text-lg font-semibold text-primary-dark">No plays of yours in {communityName} yet.</p>
                    <p className="mt-1 text-xs text-gray-600">
                      You have {elsewhere.length} {elsewhere.length === 1 ? "play" : "plays"} in other communities:{" "}
                      {elsewhereByCommunity.map((c, index) => (
                        <span key={c.id}>
                          {index > 0 && ", "}
                          <Link href={`/communities/${c.id}?tab=airmen`} className="font-semibold text-primary underline underline-offset-2">{c.name}</Link> ({c.count})
                        </span>
                      ))}
                      . Plays stay in the community you made them in.
                    </p>
                  </>
                )}
                <Link
                  href={createHref}
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-inner bg-primary-dark px-4 text-xs font-bold text-white hover:bg-primary"
                >
                  <Plus size={14} aria-hidden="true" /> {elsewhere.length === 0 ? "Create a play" : `Create one for ${communityName}`}
                </Link>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-warm-dark">From other Airmen</h3>
            <p className="mt-2 flex items-start gap-2 rounded-card border border-dashed border-silver-mid/70 bg-white p-4 text-xs text-gray-600">
              <Users size={14} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-primary-dark" />
              <span>
                {`Plays other Airmen submit to ${communityName} will appear here after an admin reviews and approves them. `}
                Publishing isn&apos;t open yet, so for now only your own plays show above.
              </span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
