/**
 * Якщо фронт зібраний на статичному хості без /api, задай у .env:
 *   VITE_API_ORIGIN=https://твій-bекенд.onrender.com
 * (без слеша в кінці). Тоді всі запити йдуть на Node.
 */
export function getApiOrigin() {
  const v = import.meta.env.VITE_API_ORIGIN;
  return typeof v === "string" ? v.trim().replace(/\/$/, "") : "";
}

export function apiUrl(path) {
  const base = getApiOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

/** Відносні /api/... з бекенда — для <img src> */
export function publicMediaUrl(href) {
  if (!href) return "";
  const s = String(href).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return apiUrl(s);
}
