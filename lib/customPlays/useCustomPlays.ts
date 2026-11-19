"use client";

import { useEffect, useState } from "react";
import { customPlayRepository } from "@/lib/customPlays/repository";
import type { CustomPlay } from "@/lib/customPlays/types";

// Live list of the Airman's custom plays. `ready` is false until the first read so
// statically rendered pages can show a loading line instead of a false empty state.
export function useCustomPlays(): { plays: CustomPlay[]; ready: boolean } {
  const [state, setState] = useState<{ plays: CustomPlay[]; ready: boolean }>({ plays: [], ready: false });

  useEffect(() => {
    let active = true;
    const load = () => {
      customPlayRepository
        .list()
        .then((plays) => active && setState({ plays, ready: true }))
        .catch(() => active && setState({ plays: [], ready: true }));
    };
    load();
    const unsubscribe = customPlayRepository.subscribe(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
}
