import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../../lib/apiOrigin";

export const pad2 = (n) => String(n).padStart(2, "0");

/** Дані події: категорії, номінанти, мій вибір. */
export function useVcEvent() {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  const reload = useCallback(async () => {
    try {
      const r = await fetch(apiUrl("/api/vc/event"), { credentials: "include" });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "Помилка завантаження");
      setState({ loading: false, error: "", data: j });
    } catch (e) {
      setState({ loading: false, error: e.message || "Помилка", data: null });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}

/** Відлік до дедлайну: { d, h, m, s, done } */
export function useCountdown(iso) {
  const target = iso ? Date.parse(iso) : NaN;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (Number.isNaN(target)) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (Number.isNaN(target)) return null;
  const diff = Math.max(0, target - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000) % 24,
    m: Math.floor(diff / 60000) % 60,
    s: Math.floor(diff / 1000) % 60,
    done: diff === 0,
  };
}

export function formatDeadline(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}
