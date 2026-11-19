import { expect, test } from "@playwright/test";
import { assemblePrompt } from "../../content/schema";
import { bracketProblem, customPlayToContentItem, detectSlots } from "../../lib/customPlays/model";
import type { CustomPlay } from "../../lib/customPlays/types";

const play: CustomPlay = {
  id: "custom-test",
  schemaVersion: 1,
  origin: "custom",
  communityId: "maintainers",
  status: "draft",
  author: { kind: "device", displayName: "You" },
  createdAt: "2026-11-18T00:00:00.000Z",
  updatedAt: "2026-11-18T00:00:00.000Z",
  title: "Shift turnover note",
  category: "write",
  level: 1,
  persona: "You are a [ROLE].",
  task: "Turn [NOTES] into a turnover for [ROLE].",
  format: "Five bullets.",
  verify: ["Tail numbers are right"],
  longAnswerSlots: ["notes"],
};

test("[BRACKETS] become unique slots in order of first use", () => {
  expect(detectSlots(play.persona, play.task).map((s) => [s.key, s.token, s.label])).toEqual([
    ["role", "ROLE", "Role"],
    ["notes", "NOTES", "Notes"],
  ]);
  expect(detectSlots("[Tail #] and [tail]").map((s) => s.key)).toEqual(["tail", "tail_2"]);
});

test("unbalanced or nested brackets are reported", () => {
  expect(bracketProblem("Use [NAME] here")).toBeNull();
  expect(bracketProblem("Use [NAME here")).not.toBeNull();
  expect(bracketProblem("Use NAME] here")).not.toBeNull();
  expect(bracketProblem("Use [A [B]]")).not.toBeNull();
});

test("a custom play assembles like a default play: blanks keep their bracket text", () => {
  const item = customPlayToContentItem(play);
  expect(item.body_segments?.feed_slots.find((s) => s.key === "notes")?.multiline).toBe(true);
  expect(assemblePrompt(item)).toBe("You are a [ROLE].\n\nTurn [NOTES] into a turnover for [ROLE].\n\nFive bullets.");
  expect(assemblePrompt(item, { role: "flight chief", notes: "Jet 12 down" })).toBe(
    "You are a flight chief.\n\nTurn Jet 12 down into a turnover for flight chief.\n\nFive bullets.",
  );
});
