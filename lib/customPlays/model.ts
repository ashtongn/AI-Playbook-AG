import type { ContentItem, FeedSlot } from "@/content/schema";
import type { CustomPlay } from "@/lib/customPlays/types";

// ─── [BRACKET] placeholders → fill-in slots ───────────────────────────────────
// Airmen write prompts with plain [PLACEHOLDERS]. Each unique placeholder becomes a
// FeedSlot whose `token` is the exact bracket text, so assemblePrompt() puts the
// original [PLACEHOLDER] back when the box is left empty.

const BRACKET = /\[([^[\]\n]+)\]/g;

function slotKey(token: string): string {
  return token.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "input";
}

function sentenceCase(text: string): string {
  const lower = text.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export interface DetectedSlot {
  key: string;
  token: string;
  label: string;
}

// Unique placeholders across the given texts, in order of first use.
export function detectSlots(...texts: string[]): DetectedSlot[] {
  const byToken = new Map<string, DetectedSlot>();
  const usedKeys = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(BRACKET)) {
      const token = match[1].trim();
      if (!token || byToken.has(token)) continue;
      let key = slotKey(token);
      for (let n = 2; usedKeys.has(key); n += 1) key = `${slotKey(token)}_${n}`;
      usedKeys.add(key);
      byToken.set(token, { key, token, label: sentenceCase(token) });
    }
  }
  return [...byToken.values()];
}

// Returns an error message when brackets are unbalanced or nested, otherwise null.
export function bracketProblem(text: string): string | null {
  let depth = 0;
  for (const char of text) {
    if (char === "[") {
      depth += 1;
      if (depth > 1) return "Brackets can't go inside other brackets.";
    } else if (char === "]") {
      depth -= 1;
      if (depth < 0) return "There's a ] without a matching [.";
    } else if (char === "\n" && depth > 0) {
      return "A [placeholder] has to close on the same line.";
    }
  }
  return depth > 0 ? "There's a [ without a matching ]." : null;
}

function toTemplate(text: string, slots: DetectedSlot[]): string {
  const keyFor = new Map(slots.map((slot) => [slot.token, slot.key]));
  return text.replace(BRACKET, (whole, inner: string) => {
    const key = keyFor.get(inner.trim());
    return key ? `{{${key}}}` : whole;
  });
}

// Render a custom play through the same ContentItem shape PlayCard2 uses.
export function customPlayToContentItem(play: CustomPlay): ContentItem {
  const slots = detectSlots(play.persona, play.task, play.format);
  const longAnswers = new Set(play.longAnswerSlots);
  const feedSlots: FeedSlot[] = slots.map((slot) => ({
    key: slot.key,
    token: slot.token,
    label: slot.label,
    placeholder: `Type ${slot.label.toLowerCase()}`,
    multiline: longAnswers.has(slot.key) || undefined,
  }));
  const prompt = [play.persona, play.task, play.format].map((part) => part.trim()).filter(Boolean).join("\n\n");

  return {
    id: play.id,
    type: "play",
    title: play.title,
    situation: play.situation || undefined,
    category: play.category,
    level: play.level,
    connectors: [],
    prompt_template: toTemplate(prompt, slots),
    body_segments: {
      persona: play.persona,
      task: play.task,
      feed_slots: feedSlots,
      format: play.format,
      verify: play.verify,
    },
    never_paste: play.neverPaste || undefined,
  };
}

export function newCustomPlayId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `custom-${Date.now().toString(36)}-${random}`;
}
