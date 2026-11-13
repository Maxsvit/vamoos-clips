import { useEffect, useState } from "react";
import { apiUrl } from "./apiOrigin";
import { VIEWERS_CHOICE_ENABLED } from "./features";

/** Один запит на сторінку; повторно — лише коли змінився користувач (вхід/вихід). */
let cache = { key: null, promise: null };

function loadStatus(key) {
  if (cache.key !== key || !cache.promise) {
    cache = {
      key,
      promise: fetch(apiUrl("/api/vc/status"), { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ phase: "soon", isAdmin: false })),
    };
  }
  return cache.promise;
}

/**
 * Чи показувати посилання на Viewers Choice (меню, смуга на головній).
 * У фазі «soon» їх бачать лише адміни.
 */
export function useVcVisible(userKey = "") {
  const [state, setState] = useState({ visible: false, isAdmin: false, phase: null });

  useEffect(() => {
    if (!VIEWERS_CHOICE_ENABLED) return undefined;
    let alive = true;
    loadStatus(userKey).then((j) => {
      if (!alive) return;
      const phase = j?.phase || "soon";
      setState({ visible: phase !== "soon" || !!j?.isAdmin, isAdmin: !!j?.isAdmin, phase });
    });
    return () => {
      alive = false;
    };
  }, [userKey]);

  return state;
}
