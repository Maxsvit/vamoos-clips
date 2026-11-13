import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../lib/apiOrigin";
import { useAuth } from "../../context/AuthContext";
import { Avatar, TwitchLoginButton, VcHeader, VcState } from "./shared";

async function api(path, body) {
  const r = await fetch(apiUrl(path), {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.success) {
    const e = new Error(j.error || `Помилка ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return j;
}

const btn =
  "vc-mono min-h-[36px] cursor-pointer border border-[var(--vc-line)] px-3 text-[11px] text-[var(--vc-fg)] hover:border-[var(--vc-fg)] disabled:opacity-40";

export default function ViewersChoiceAdmin() {
  const { user, loading, login } = useAuth();
  const [tab, setTab] = useState("writeins");
  const [denied, setDenied] = useState("");

  return (
    <div className="vc-root">
      <VcHeader />
      {loading ? (
        <VcState title="Завантаження…" />
      ) : !user ? (
        <VcState title="Адмінка" text="Увійдіть через Twitch акаунтом із VC_ADMIN_LOGINS.">
          <div>
            <TwitchLoginButton onClick={login} accent />
          </div>
        </VcState>
      ) : denied ? (
        <VcState title="Немає доступу" text={denied} />
      ) : (
        <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
            <h1 className="vc-display m-0 text-[clamp(32px,4vw,56px)] font-black uppercase leading-none tracking-[-0.03em]">
              Адмінка
            </h1>
            <Link to="/viewers-choice/results" className="vc-mono text-[13px]">
              РЕЗУЛЬТАТИ НАЖИВО ↗
            </Link>
          </div>
          <LiveStats />
          <div className="mb-8 flex flex-wrap border border-[var(--vc-line)]" role="tablist">
            {[
              ["writeins", "Додані глядачами"],
              ["seen", "Автозбір укр. стрімерів"],
            ].map(([k, t]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`vc-display min-h-[48px] cursor-pointer px-5 text-[13px] font-bold uppercase ${
                  tab === k ? "bg-[var(--vc-fg)] text-[var(--vc-bg)]" : "text-[var(--vc-muted)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "writeins" ? <WriteIns onDenied={setDenied} /> : <Seen onDenied={setDenied} />}
        </div>
      )}
    </div>
  );
}

/** Наживо: скільки людей проголосувало, оновлюється кожні 30 секунд. */
function LiveStats() {
  const [s, setS] = useState(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const j = await api("/api/vc/admin/stats");
        if (alive) setS(j);
      } catch {
        /* немає доступу або база недоступна — блок просто не показуємо */
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!s) return null;
  const max = Math.max(1, ...s.hourly);
  return (
    <section className="mb-8 border border-[var(--vc-line)]" aria-label="Статистика наживо">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {[
          [s.totalBallots, "ПРОГОЛОСУВАЛО ВСЬОГО"],
          [s.last24h, "ЗА ОСТАННЮ ДОБУ"],
          [s.lastHour, "ЗА ОСТАННЮ ГОДИНУ"],
          [s.changedBallots, "ЗМІНИЛИ СВІЙ ВИБІР"],
        ].map(([v, l], i) => (
          <div key={l} className={`flex flex-col gap-1.5 border-[var(--vc-line)] p-5 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""} lg:border-r`}>
            <span className="vc-display text-[36px] font-black leading-none">{Number(v).toLocaleString("uk-UA")}</span>
            <span className="vc-mono text-[11px] text-[var(--vc-muted)]">{l}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--vc-line)] p-5">
        <span className="vc-mono text-[11px] text-[var(--vc-muted)]">НОВІ ГОЛОСИ ПО ГОДИНАХ (ОСТАННІ 24 ГОД) · ОНОВЛЮЄТЬСЯ КОЖНІ 30 С</span>
        <div className="mt-3 flex h-20 items-end gap-1" role="img" aria-label={`Голоси по годинах: ${s.hourly.join(", ")}`}>
          {s.hourly.map((n, i) => (
            <span
              key={i}
              title={`${23 - i === 0 ? "остання година" : `${23 - i} год тому`}: ${n}`}
              className="flex-1 bg-[var(--vc-accent)]"
              style={{ height: `${Math.max(n ? 6 : 2, (n / max) * 100)}%`, opacity: n ? 1 : 0.25 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function WriteIns({ onDenied }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api("/api/vc/admin/overview"));
      setError("");
    } catch (e) {
      if (e.status === 403) onDenied(e.message);
      else setError(e.message);
    }
  }, [onDenied]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (categoryId, loginName, status) => {
    setBusy(`${categoryId}|${loginName}`);
    try {
      await api("/api/vc/admin/override", { categoryId, login: loginName, status });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  if (error) return <p className="vc-mono text-sm text-[#ff8a7a]">✕ {error}</p>;
  if (!data) return <p className="vc-mono text-sm text-[var(--vc-muted)]">ЗАВАНТАЖЕННЯ…</p>;

  return (
    <div className="flex flex-col gap-10">
      <p className="m-0 text-sm text-[var(--vc-muted)]">
        {data.threshold > 1
          ? `Номінанта, якого додали глядачі, бачать усі, коли його додали ${data.threshold}+ різних людей і мова каналу ${data.languages.join(", ")}.`
          : `Номінанта, якого додав глядач, одразу бачать усі, якщо мова каналу ${data.languages.join(", ")}.`}{" "}
        Неукраїномовні канали чекають тут на перевірку. «Схвалити» показує одразу, «Приховати» прибирає з
        категорії, і голоси за нього не рахуються.
      </p>
      {data.categories.map((c) => (
        <section key={c.id} className="flex flex-col gap-3">
          <h2 className="vc-display m-0 flex flex-wrap items-baseline gap-3 text-xl font-bold uppercase">
            {c.title}
            <span className="vc-mono text-xs font-normal text-[var(--vc-muted)]">
              {c.listCount} ЗІ СПИСКУ · {c.writeIns.length} ДОДАНО ГЛЯДАЧАМИ · {c.hidden.length} ПРИХОВАНО
            </span>
          </h2>
          {c.writeIns.length === 0 && c.hidden.length === 0 ? (
            c.missingOnTwitch?.length ? null :
            <p className="vc-mono m-0 text-xs text-[var(--vc-dim)]">НІЧОГО НОВОГО</p>
          ) : (
            <div className="border-t border-[var(--vc-line)]">
              {c.writeIns.map((n) => (
                <Row key={n.login} n={n}>
                  <span className={`vc-mono text-xs ${n.visible ? "text-[var(--vc-accent)]" : "text-[#ffe28a]"}`}>
                    {n.visible ? "● ВИДНО ВСІМ" : n.needsReview ? "○ МАЛИЙ КАНАЛ, ПЕРЕВІРТЕ" : "○ ЧЕКАЄ"} · {n.count}/
                    {data.threshold} · {n.language || "?"}
                    {n.status === "approved" ? " · СХВАЛЕНО" : ""}
                  </span>
                  <span className="flex gap-2">
                    {n.status !== "approved" && (
                      <button type="button" className={btn} disabled={!!busy} onClick={() => act(c.id, n.login, "approved")}>
                        СХВАЛИТИ
                      </button>
                    )}
                    {n.status === "approved" && (
                      <button type="button" className={btn} disabled={!!busy} onClick={() => act(c.id, n.login, "clear")}>
                        СКИНУТИ
                      </button>
                    )}
                    <button type="button" className={btn} disabled={!!busy} onClick={() => act(c.id, n.login, "hidden")}>
                      ПРИХОВАТИ
                    </button>
                  </span>
                </Row>
              ))}
              {c.hidden.map((n) => (
                <Row key={`h-${n.login}`} n={n} dim>
                  <span className="vc-mono text-xs text-[var(--vc-dim)]">✕ ПРИХОВАНО</span>
                  <button type="button" className={btn} disabled={!!busy} onClick={() => act(c.id, n.login, "clear")}>
                    ПОВЕРНУТИ
                  </button>
                </Row>
              ))}
            </div>
          )}
          {c.missingOnTwitch?.length > 0 && (
            <p className="vc-mono m-0 border border-[#3a2f12] bg-[#1d1a0a] p-3 text-xs leading-relaxed text-[#ffe28a]">
              НЕ ЗНАЙДЕНО НА TWITCH, ПРИБРАНО З ГОЛОСУВАННЯ ({c.missingOnTwitch.length}):{" "}
              <span className="text-[var(--vc-fg)]">{c.missingOnTwitch.join(", ")}</span>. Канал видалили, забанили або
              змінили нік. Щоб повернути, впишіть новий нік у server/viewers-choice/2026.json.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

function Row({ n, dim, children }) {
  return (
    <div
      className={`grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b border-[var(--vc-line)] py-3 sm:grid-cols-[40px_minmax(0,1fr)_auto_auto] ${
        dim ? "opacity-60" : ""
      }`}
    >
      <Avatar src={n.avatarUrl} label={n.login} className="h-10 w-10 text-xs" />
      <a
        href={`https://twitch.tv/${n.login}`}
        target="_blank"
        rel="noreferrer"
        className="vc-display truncate text-sm font-bold uppercase text-[var(--vc-fg)] no-underline hover:underline"
      >
        {n.displayName || n.login}
      </a>
      {children}
    </div>
  );
}

const LIMIT = 300;

function Seen({ onDenied }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [catId, setCatId] = useState("");
  const [game, setGame] = useState("");
  const [q, setQ] = useState("");
  const [onlyNew, setOnlyNew] = useState(true);
  const [sort, setSort] = useState("viewers");
  const [minViewers, setMinViewers] = useState(null);
  const [minSightings, setMinSightings] = useState("");
  const [checked, setChecked] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const j = await api("/api/vc/admin/seen");
      setData(j);
      setError("");
      setCatId((c) => c || j.categories[0]?.id || "");
      setMinViewers((v) => (v === null ? String(j.minAvgViewers ?? 0) : v));
    } catch (e) {
      if (e.status === 403) onDenied(e.message);
      else setError(e.message);
    }
  }, [onDenied]);

  useEffect(() => {
    load();
  }, [load]);

  const cat = data?.categories.find((c) => c.id === catId);

  const pickCategory = (id) => {
    setCatId(id);
    setChecked(new Set());
    const c = data.categories.find((x) => x.id === id);
    setGame(c?.suggestGames?.[0] || "");
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const g = game.trim().toLowerCase();
    const qq = q.trim().toLowerCase();
    const minV = Math.max(0, parseInt(minViewers ?? "", 10) || 0);
    const minS = Math.max(0, parseInt(minSightings, 10) || 0);
    const list = data.streamers.filter(
      (s) =>
        (!onlyNew || !s.inCategories.includes(catId)) &&
        (!g || s.games.some((x) => x.toLowerCase().includes(g))) &&
        (!qq || s.login.includes(qq) || s.displayName.toLowerCase().includes(qq)) &&
        (s.avgViewers ?? s.maxViewers) >= minV &&
        s.sightings >= minS
    );
    const by = {
      viewers: (a, b) => (b.avgViewers ?? 0) - (a.avgViewers ?? 0) || b.maxViewers - a.maxViewers,
      peak: (a, b) => b.maxViewers - a.maxViewers || b.sightings - a.sightings,
      sightings: (a, b) => b.sightings - a.sightings || b.maxViewers - a.maxViewers,
      recent: (a, b) => String(b.lastSeen || "").localeCompare(String(a.lastSeen || "")),
      name: (a, b) => a.login.localeCompare(b.login),
    };
    return list.sort(by[sort] || by.viewers);
  }, [data, game, q, onlyNew, catId, minViewers, minSightings, sort]);

  const toggle = (l) =>
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(l)) n.delete(l);
      else n.add(l);
      return n;
    });

  const addChecked = async () => {
    setBusy(true);
    try {
      const j = await api("/api/vc/admin/override", { categoryId: catId, logins: [...checked], status: "approved" });
      setNote(`Додано ${j.updated} у «${cat.title}»`);
      setChecked(new Set());
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const collectNow = async () => {
    setBusy(true);
    try {
      const j = await api("/api/vc/admin/collect-now", {});
      setNote(`Зібрано ${j.collected} каналів в ефірі`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="vc-mono text-sm text-[#ff8a7a]">✕ {error}</p>;
  if (!data) return <p className="vc-mono text-sm text-[var(--vc-muted)]">ЗАВАНТАЖЕННЯ…</p>;

  const input =
    "vc-mono min-h-[44px] border border-[var(--vc-line)] bg-transparent px-3 text-sm text-[var(--vc-fg)] outline-none focus:border-[var(--vc-accent)]";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="m-0 max-w-[720px] text-sm text-[var(--vc-muted)]">
          Сервер щогодини записує українськомовні канали, що в ефірі, і рахує їхніх середніх глядачів. За
          замовчуванням показано канали від {data.minAvgViewers} глядачів у середньому, поріг можна змінити праворуч. Усього
          зібрано:{" "}
          <strong className="text-[var(--vc-fg)]">{data.streamers.length}</strong>.
          {data.collector.lastRun ? ` Останній збір: ${new Date(data.collector.lastRun).toLocaleString("uk-UA")}.` : ""}
          {!data.collector.enabled ? " Автозбір вимкнено." : ""} Позначте потрібних і додайте в категорію.
        </p>
        <button type="button" className={btn} disabled={busy} onClick={collectNow}>
          ЗІБРАТИ ЗАРАЗ
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={catId} onChange={(e) => pickCategory(e.target.value)} className={`${input} bg-[var(--vc-bg)]`} aria-label="Категорія">
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <input value={game} onChange={(e) => setGame(e.target.value)} placeholder="гра, напр. Dota 2" className={input} aria-label="Фільтр за грою" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="нік" className={input} aria-label="Пошук за ніком" />
        <label className="vc-mono flex min-h-[44px] cursor-pointer items-center gap-2 px-2 text-xs text-[var(--vc-muted)]">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          ЛИШЕ ЩЕ НЕ В КАТЕГОРІЇ
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !checked.size}
          onClick={addChecked}
          className="vc-display min-h-[48px] cursor-pointer bg-[var(--vc-accent)] px-5 text-[13px] font-bold uppercase text-[var(--vc-bg)] disabled:opacity-40"
        >
          Додати {checked.size || ""} у «{cat?.title}»
        </button>
        <button type="button" className={btn} onClick={() => setChecked(new Set(filtered.slice(0, LIMIT).map((s) => s.login)))}>
          ПОЗНАЧИТИ ВСІХ НА ЕКРАНІ
        </button>
        <button type="button" className={btn} onClick={() => setChecked(new Set())}>
          ЗНЯТИ ПОЗНАЧКИ
        </button>
        <span className="vc-mono text-xs text-[var(--vc-muted)]">
          ЗНАЙДЕНО {filtered.length}
          {filtered.length > LIMIT ? `, ПОКАЗАНО ${LIMIT}` : ""}
        </span>
        {note && <span className="vc-mono text-xs text-[var(--vc-accent)]">● {note}</span>}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="vc-mono flex items-center gap-2 text-xs text-[var(--vc-muted)]">
            СОРТУВАТИ
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${input} bg-[var(--vc-bg)]`}>
              <option value="viewers">за середніми глядачами</option>
              <option value="peak">за піком глядачів</option>
              <option value="sightings">за кількістю ефірів</option>
              <option value="recent">за останнім ефіром</option>
              <option value="name">за ніком</option>
            </select>
          </label>
          <label className="vc-mono flex items-center gap-2 text-xs text-[var(--vc-muted)]">
            СЕР. ГЛЯДАЧІВ ВІД
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={minViewers ?? ""}
              onChange={(e) => setMinViewers(e.target.value)}
              placeholder="0"
              className={`${input} w-[90px]`}
            />
          </label>
          <label className="vc-mono flex items-center gap-2 text-xs text-[var(--vc-muted)]">
            ЕФІРІВ ВІД
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={minSightings}
              onChange={(e) => setMinSightings(e.target.value)}
              placeholder="0"
              className={`${input} w-[80px]`}
            />
          </label>
        </div>
      </div>

      <div className="border-t border-[var(--vc-line)]">
        {filtered.slice(0, LIMIT).map((s) => (
          <label
            key={s.login}
            className="grid cursor-pointer grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-[var(--vc-line)] py-2.5 sm:grid-cols-[24px_minmax(0,220px)_minmax(0,1fr)_auto]"
          >
            <input type="checkbox" checked={checked.has(s.login)} onChange={() => toggle(s.login)} />
            <span className="vc-display truncate text-sm font-bold uppercase">{s.displayName}</span>
            <span className="vc-mono col-span-2 truncate text-xs text-[var(--vc-muted)] sm:col-span-1">
              {s.games.slice(0, 4).join(" · ")}
            </span>
            <span className="vc-mono text-right text-xs text-[var(--vc-muted)]">
              СЕР. {(s.avgViewers ?? 0).toLocaleString("uk-UA")} · МАКС. {s.maxViewers.toLocaleString("uk-UA")} · {s.sightings} ЕФ.
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
