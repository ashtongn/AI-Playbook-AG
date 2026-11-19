import type { Level } from "@/content/schema";

// ─── User-authored plays ──────────────────────────────────────────────────────
// A custom play is written by an Airman and, today, saved only on their device.
// The record is shaped for the future publish flow: the author requests to publish
// it to a community, an admin reviews it, and approved plays join the global plays.
// Only `draft` is reachable now; the other statuses and the `review` block are
// reserved so stored records don't need migrating when that flow ships.

export const CUSTOM_PLAY_SCHEMA_VERSION = 1;

export type PlayPublicationStatus = "draft" | "pending_review" | "approved" | "rejected";

// Who wrote the play. `device` means no signed-in account; `account` copies the
// platform identity at save time so a backend can later attribute the play.
export interface PlayAuthor {
  kind: "device" | "account";
  displayName: string;
  email?: string;
  afsc?: string;
  rank?: string;
}

// Reserved for the publish flow: request → admin review → approved / rejected.
export interface PlayReview {
  requestedAt?: string;        // ISO; set when the author requests to publish
  targetCommunityId?: string;  // community the author asked to publish into
  reviewedAt?: string;         // ISO; set when an admin decides
  reviewerEmail?: string;
  note?: string;               // admin feedback, e.g. why it was rejected
}

export interface CustomPlay {
  id: string;                  // always `custom-…` so it never collides with a default play id
  schemaVersion: typeof CUSTOM_PLAY_SCHEMA_VERSION;
  origin: "custom";
  communityId: string;         // the community the play lives in
  status: PlayPublicationStatus;
  author: PlayAuthor;
  review?: PlayReview;
  createdAt: string;           // ISO
  updatedAt: string;           // ISO

  // Authored content. [BRACKETED] text in persona/task/format becomes a fill-in box.
  title: string;
  situation?: string;
  category: string;
  level: Level;
  persona: string;
  task: string;
  format: string;
  verify: string[];
  neverPaste?: string;
  longAnswerSlots: string[];   // slot keys that render as a multi-line box
}

export const PLAY_STATUS_LABEL: Record<PlayPublicationStatus, string> = {
  draft: "On this device",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Not approved",
};
