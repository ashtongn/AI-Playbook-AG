import type { CustomPlay } from "@/lib/customPlays/types";

// Storage seam for user-authored plays. Today the only implementation is device-local
// (localStorage). A platform backend can implement the same interface later — every
// method is already async so callers don't change when storage moves off the device.
export interface CustomPlayRepository {
  list(): Promise<CustomPlay[]>;
  get(id: string): Promise<CustomPlay | undefined>;
  save(play: CustomPlay): Promise<CustomPlay>;
  remove(id: string): Promise<void>;
  // Called whenever stored plays change (this tab or another tab). Returns an unsubscribe.
  subscribe(onChange: () => void): () => void;
}

const STORAGE_KEY = "ap.customPlays";
const CHANGE_EVENT = "ap:custom-plays-change";

function readAll(): CustomPlay[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CustomPlay[]) : [];
  } catch {
    return [];
  }
}

function writeAll(plays: CustomPlay[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plays));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const localCustomPlayRepository: CustomPlayRepository = {
  async list() {
    return readAll();
  },
  async get(id) {
    return readAll().find((play) => play.id === id);
  },
  async save(play) {
    const plays = readAll();
    const index = plays.findIndex((existing) => existing.id === play.id);
    const next = index === -1 ? [...plays, play] : plays.map((existing, i) => (i === index ? play : existing));
    writeAll(next);
    return play;
  },
  async remove(id) {
    writeAll(readAll().filter((play) => play.id !== id));
  },
  subscribe(onChange) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEY) onChange();
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  },
};

// The active repository. Swap this for an API-backed implementation when plays sync to an account.
export const customPlayRepository: CustomPlayRepository = localCustomPlayRepository;
