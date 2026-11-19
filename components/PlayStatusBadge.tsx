import { BadgeCheck, CircleX, Clock, HardDrive } from "lucide-react";
import { PLAY_STATUS_LABEL, type PlayPublicationStatus } from "@/lib/customPlays/types";

const ICON = {
  draft: HardDrive,
  pending_review: Clock,
  approved: BadgeCheck,
  rejected: CircleX,
} satisfies Record<PlayPublicationStatus, unknown>;

const TONE: Record<PlayPublicationStatus, string> = {
  draft: "bg-silver-tint text-primary-dark border-silver-mid",
  pending_review: "bg-warm-tint text-warm-dark border-warm/60",
  approved: "bg-primary-ghost text-primary border-primary/25",
  rejected: "bg-white text-af-red border-af-red/40",
};

// Status of a user-authored play. Text plus icon, never color alone.
export default function PlayStatusBadge({ status }: { status: PlayPublicationStatus }) {
  const Icon = ICON[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-badge border ${TONE[status]}`}>
      <Icon size={9} aria-hidden="true" /> {PLAY_STATUS_LABEL[status]}
    </span>
  );
}
