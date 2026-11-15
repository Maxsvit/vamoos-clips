import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiUrl } from "../../lib/apiOrigin";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Marquee, TwitchLoginButton, VcHeader, VcState, SoonPreviewBanner, VcSoon } from "./shared";
import { formatDeadline, pad2, useCountdown, useVcEvent } from "./vcData";
import AddStreamer from "./AddStreamer";

const SEED_KEY = "vc-shuffle-seed";
const draftKey = (eventId) => `vc-draft-${eventId}`;

function readStore(store, key) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(store, key, value) {
  try {
    if (value == null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    /* приватний режим — працюємо без збереження */
  }
}

/**
 * Стабільний випадковий порядок на сесію (щоб перші в списку не мали переваги).
 * Сортуємо за хешем (seed + логін): новий номінант не перемішує решту.
 */
function hashKey(seed, login) {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < login.length; i++) {
    h ^= login.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function shuffled(list, seed) {
  return [...list].sort((a, b) => hashKey(seed, a.login) - hashKey(seed, b.login));
}

function getSeed() {
  let v = Number(readStore(sessionStorage, SEED_KEY));
  if (!v) {
    v = Math.floor(Math.random() * 2 ** 31) + 1;
    writeStore(sessionStorage, SEED_KEY, String(v));
  }
  return v;
}

const samePicks = (a = {}, b = {}) => {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
};

export default function ViewersChoiceVote() {
  const { loading, error, data, reload } = useVcEvent();
  if (loading) {
    return (
      <Shell>
        <VcState title="Завантаження…" />
      </Shell>
    );
  }
  if (error || !data) {
    return (
      <Shell>
        <VcState title="Щось пішло не так" text={error} />
      </Shell>
    );
  }
  if (data.event.phase === "soon") {
    if (!data.me.isAdmin) return <VcSoon />;
    return <Ballot data={data} onReload={reload} preview />;
  }
  if (data.event.phase !== "voting") {
    return (
      <Shell>
        <VcState
          title="Голосування закрите"
          text={
            data.event.phase === "results"
              ? "Переможців уже оголошено."
              : "Дякуємо всім, хто проголосував! Переможців оголосимо на церемонії на стримі."
          }
        >
          <Link
            to={data.event.phase === "results" ? "/viewers-choice/results" : "/viewers-choice"}
            className="vc-display inline-flex min-h-[52px] w-fit items-center bg-[var(--vc-accent)] px-7 text-sm font-bold uppercase text-[var(--vc-bg)] no-underline"
          >
            {data.event.phase === "results" ? "Дивитися результати →" : "На головну →"}
          </Link>
        </VcState>
      </Shell>
    );
  }
  return <Ballot data={data} onReload={reload} />;
}

function Shell({ children, deadline }) {
  const d = formatDeadline(deadline);
  return (
    <div className="vc-root">
      <Marquee
        items={["VIEWERS CHOICE 2026", "ГОЛОСУВАННЯ ТРИВАЄ", d ? `ДО ${d.toUpperCase()}` : "", "ОДИН ГОЛОС У КОЖНІЙ КАТЕГОРІЇ"].filter(Boolean)}
      />
      <VcHeader />
      {children}
    </div>
  );
}

function Ballot({ data, onReload, preview = false }) {
  const { user, login } = useAuth();
  const { event, categories } = data;
  const total = categories.length;
  const [params, setParams] = useSearchParams();
  const cd = useCountdown(event.votingDeadline);

  const [saved, setSaved] = useState(data.me.ballot?.picks || {});
  const [picks, setPicks] = useState(() => {
    const base = data.me.ballot?.picks || {};
    try {
      const draft = JSON.parse(readStore(localStorage, draftKey(event.id)) || "null");
      if (draft && typeof draft === "object") return { ...base, ...draft };
    } catch {
      /* ignore */
    }
    return base;
  });
  const [query, setQuery] = useState("");
  const [submit, setSubmit] = useState({ busy: false, error: "", ok: false });

  const stepFromUrl = () => {
    const c = params.get("c");
    if (c === "summary") return total;
    const i = categories.findIndex((x) => x.id === c);
    return i >= 0 ? i : 0;
  };
  const step = stepFromUrl();
  const isSummary = step === total;
  const current = isSummary ? null : categories[step];

  const goTo = (i) => {
    const next = i >= total ? "summary" : categories[Math.max(0, i)].id;
    setParams({ c: next }, { replace: false });
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (samePicks(picks, saved)) writeStore(localStorage, draftKey(event.id), null);
    else writeStore(localStorage, draftKey(event.id), JSON.stringify(picks));
  }, [picks, saved, event.id]);

  const seed = useMemo(getSeed, []);
  const order = useMemo(() => {
    const map = {};
    categories.forEach((c, i) => {
      map[c.id] = shuffled(c.nominees, seed + i * 7919);
    });
    return map;
  }, [categories, seed]);

  const nominees = useMemo(() => {
    if (!current) return [];
    const q = query.trim().toLowerCase();
    const list = order[current.id];
    return q
      ? list.filter(
          (n) =>
            n.login.includes(q) ||
            String(n.displayName || "").toLowerCase().includes(q)
        )
      : list;
  }, [current, order, query]);

  const tabsRef = useRef(null);
  useEffect(() => {
    const el = tabsRef.current?.querySelector('[aria-current="step"]');
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [step]);

  const pickedCount = categories.filter((c) => picks[c.id]).length;
  const dirty = !samePicks(picks, saved);
  const pickedHere = current ? picks[current.id] : null;

  const choose = (catId, loginName) => {
    setSubmit((s) => ({ ...s, ok: false, error: "" }));
    setPicks((p) => {
      const next = { ...p };
      if (next[catId] === loginName) delete next[catId];
      else next[catId] = loginName;
      return next;
    });
  };

  const onAdded = async (catId, loginName) => {
    await onReload();
    setPicks((p) => ({ ...p, [catId]: loginName }));
    setSubmit((s) => ({ ...s, ok: false, error: "" }));
  };

  const send = async () => {
    if (!user) {
      login();
      return;
    }
    const hadBallot = Object.keys(saved).length > 0;
    setSubmit({ busy: true, error: "", ok: false });
    try {
      const r = await fetch(apiUrl("/api/vc/ballot"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        login();
        return;
      }
      if (!r.ok || !j.success) throw new Error(j.error || "Не вдалося зберегти голос");
      setSaved(j.ballot.picks);
      setPicks(j.ballot.picks);
      setSubmit({ busy: false, error: "", ok: true });
      /* Подія для Google Analytics: видно, скільки людей проголосувало */
      window.gtag?.("event", "vc_vote", { categories: Object.keys(j.ballot.picks).length, updated: hadBallot });
    } catch (e) {
      setSubmit({ busy: false, error: e.message, ok: false });
    }
  };

  const findNominee = (cat, loginName) =>
    cat.nominees.find((n) => n.login === loginName);

  return (
    <Shell deadline={event.votingDeadline}>
      {preview && <SoonPreviewBanner />}
      <div className="border-b border-[var(--vc-line)]">
        <div className="vc-mono mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px] text-[var(--vc-muted)] sm:px-6">
          <span>
            {cd ? (
              <>
                ЗАЛИШИЛОСЬ{" "}
                <strong className="text-[var(--vc-fg)]">
                  {pad2(cd.d)}:{pad2(cd.h)}:{pad2(cd.m)}:{pad2(cd.s)}
                </strong>
              </>
            ) : null}
          </span>
          {!user && (
            <span className="flex flex-wrap items-center gap-3">
              <span>Щоб проголосувати, увійдіть через Twitch. Ваш вибір збережеться.</span>
              <TwitchLoginButton onClick={login} accent />
            </span>
          )}
        </div>
      </div>

      <nav className="border-b border-[var(--vc-line)]" aria-label="Категорії">
        <div ref={tabsRef} className="vc-tabs mx-auto flex max-w-[1320px] overflow-x-auto px-4 sm:px-6">
          {[...categories, { id: "summary", title: "Ваш вибір" }].map((c, i) => {
            const active = i === step;
            const done = i < total && !!picks[c.id];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => goTo(i)}
                aria-current={active ? "step" : undefined}
                className={`flex min-h-[56px] shrink-0 cursor-pointer items-center gap-2.5 border-r border-[var(--vc-line)] px-5 ${
                  active ? "bg-[var(--vc-fg)] text-[var(--vc-bg)]" : "text-[var(--vc-muted)] hover:text-[var(--vc-fg)]"
                }`}
              >
                <span className="vc-mono text-xs opacity-70">{i < total ? pad2(i + 1) : "→"}</span>
                <span className="vc-display whitespace-nowrap text-[13px] font-bold uppercase">{c.title}</span>
                <span className={`h-2 w-2 ${done ? "bg-[var(--vc-accent)]" : ""}`} />
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-[1320px] px-4 pt-12 sm:px-6">
        {current && (
          <>
            <div className="flex flex-col gap-6 pb-8">
              <div className="flex min-w-0 flex-col gap-3.5">
                <span className="vc-mono text-[13px] text-[var(--vc-accent)]">
                  НОМІНАЦІЯ {pad2(step + 1)} / {pad2(total)}
                </span>
                <h1 className="vc-display m-0 text-[clamp(26px,3.6vw,52px)] font-black uppercase leading-[1.12] tracking-[-0.03em]">
                  {current.title}
                </h1>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[var(--vc-line)] py-4">
                <span className="vc-mono text-[13px] text-[var(--vc-muted)]">
                  {current.nominees.length} НОМІНАНТІВ
                  {query ? ` · ЗНАЙДЕНО ${nominees.length}` : ""}
                </span>
                <label className="flex min-h-[56px] w-full items-center gap-3 border border-[var(--vc-line)] px-5 focus-within:border-[var(--vc-muted)] sm:w-[480px]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-[var(--vc-muted)]">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                  <span className="sr-only">Пошук стрімера</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Знайти стрімера за ніком"
                    className="vc-mono min-w-0 flex-1 bg-transparent text-[15px] text-[var(--vc-fg)] outline-none placeholder:text-[var(--vc-dim)] focus-visible:outline-none"
                  />
                </label>
              </div>
            </div>

            {nominees.length === 0 ? (
              <p className="vc-mono m-0 border border-[var(--vc-line)] px-5 py-10 text-sm text-[var(--vc-muted)]">
                {query ? `НІКОГО НЕ ЗНАЙДЕНО ЗА «${query}»` : "У ЦІЙ КАТЕГОРІЇ ЩЕ НЕМАЄ НОМІНАНТІВ"}
              </p>
            ) : (
              <div className="grid grid-cols-2 border-l border-t border-[var(--vc-line)] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                {nominees.map((n, i) => {
                  const sel = pickedHere === n.login;
                  return (
                    <div
                      key={n.login}
                      className={`vc-card flex flex-col border-b border-r border-[var(--vc-line)] ${
                        sel ? "bg-[var(--vc-accent)] text-[var(--vc-bg)]" : "bg-[var(--vc-bg)] text-[var(--vc-fg)] hover:bg-[#151515]"
                      }`}
                    >
                      <button
                        type="button"
                        aria-pressed={sel}
                        onClick={() => choose(current.id, n.login)}
                        className="flex flex-1 cursor-pointer flex-col gap-3 p-3.5 pb-2 text-left text-inherit sm:p-4 sm:pb-2"
                      >
                        <span className="vc-mono flex items-center justify-between text-[11px]">
                          <span>#{pad2(i + 1)}</span>
                          <span>{sel ? "● ОБРАНО" : "○ ОБРАТИ"}</span>
                        </span>
                        <Avatar src={n.avatarUrl} label={n.login} className="aspect-square w-full text-5xl" />
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="vc-display truncate text-[15px] font-bold uppercase tracking-[-0.01em]">
                            {n.displayName || n.login}
                          </span>
                          {n.onlyMe ? (
                            <span className={`vc-mono text-[10px] ${sel ? "text-[#2a1650]" : "text-[#ffe28a]"}`}>
                              ВИДНО ЛИШЕ ВАМ · {n.count}/{event.writeIns.threshold}
                            </span>
                          ) : n.addedByViewers ? (
                            <span className={`vc-mono text-[10px] ${sel ? "text-[#2a1650]" : "text-[var(--vc-accent)]"}`}>
                              + ДОДАЛИ ГЛЯДАЧІ
                            </span>
                          ) : null}
                        </span>
                      </button>
                      <a
                        href={`https://www.twitch.tv/${n.login}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Відкрити канал ${n.displayName || n.login} на Twitch`}
                        className={`vc-mono mx-3.5 mb-3.5 flex min-h-[32px] items-center justify-between gap-2 truncate text-[11px] no-underline hover:underline sm:mx-4 sm:mb-4 ${
                          sel ? "text-[#2a1650]" : "text-[var(--vc-muted)] hover:text-[var(--vc-fg)]"
                        }`}
                      >
                        <span className="truncate">twitch.tv/{n.login}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
            {event.writeIns.enabled && (
              <AddStreamer
                key={`${current.id}|${query}`}
                category={current}
                user={user}
                onLogin={login}
                threshold={event.writeIns.threshold}
                minAvgViewers={event.writeIns.minAvgViewers || 0}
                initialQuery={nominees.length === 0 ? query : ""}
                empty={current.nominees.length === 0}
                onAdded={(loginName) => onAdded(current.id, loginName)}
              />
            )}
          </>
        )}

        {isSummary && (
          <>
            <div className="flex flex-col gap-3.5 pb-8">
              <h1 className="vc-display m-0 text-[clamp(30px,4.8vw,68px)] font-black uppercase leading-[1.12] tracking-[-0.035em]">
                Ваш вибір
              </h1>
              <p className="m-0 text-base text-[var(--vc-muted)]">
                Можна проголосувати не в усіх категоріях. Вибір можна змінювати до кінця голосування.
              </p>
            </div>
            <div className="border-t border-[var(--vc-line)]">
              {categories.map((c, i) => {
                const n = picks[c.id] ? findNominee(c, picks[c.id]) : null;
                return (
                  <div
                    key={c.id}
                    className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--vc-line)] py-4 sm:grid-cols-[64px_minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <span className="vc-mono text-[13px] text-[var(--vc-muted)]">{pad2(i + 1)}</span>
                    <span className="text-[15px] font-semibold uppercase tracking-[0.04em] text-[var(--vc-muted)]">{c.title}</span>
                    <span className="col-start-2 flex min-w-0 items-center gap-3 sm:col-start-auto">
                      {n && <Avatar src={n.avatarUrl} label={n.login} className="h-9 w-9 shrink-0 text-xs" />}
                      <span
                        className={`vc-display truncate text-lg font-bold uppercase ${n ? "text-[var(--vc-accent)]" : "text-[var(--vc-dim)]"}`}
                      >
                        {n ? n.displayName || n.login : "— не обрано"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      className="vc-mono row-start-1 min-h-[44px] cursor-pointer border border-[var(--vc-line)] px-4 text-xs text-[var(--vc-fg)] hover:border-[var(--vc-fg)] sm:row-start-auto col-start-3 sm:col-start-auto"
                    >
                      {n ? "ЗМІНИТИ ↗" : "ОБРАТИ ↗"}
                    </button>
                  </div>
                );
              })}
            </div>
            {submit.ok && (
              <p className="vc-mono mt-6 text-sm text-[var(--vc-accent)]" role="status">
                ● ГОЛОС ЗАРАХОВАНО. ДЯКУЄМО! ВИБІР МОЖНА ЗМІНИТИ ДО КІНЦЯ ГОЛОСУВАННЯ.
              </p>
            )}
            {submit.error && (
              <p className="vc-mono mt-6 text-sm text-[#ff8a7a]" role="alert">
                ✕ {submit.error}
              </p>
            )}
          </>
        )}
      </main>

      <div className="sticky bottom-0 mt-12 border-t border-[var(--vc-line)] bg-[var(--vc-bg)]">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-5">
            <span className="vc-display text-[28px] font-black tracking-[-0.03em]">
              {pickedCount}
              <span className="text-[var(--vc-dim)]">/{total}</span>
            </span>
            <span className="hidden gap-1 sm:flex" aria-hidden="true">
              {categories.map((c) => (
                <span key={c.id} className={`h-2 w-5 ${picks[c.id] ? "bg-[var(--vc-accent)]" : "bg-[var(--vc-line)]"}`} />
              ))}
            </span>
            <span className="text-sm text-[var(--vc-muted)]">
              {isSummary
                ? dirty
                  ? "Є незбережені зміни"
                  : Object.keys(saved).length
                    ? "Голос зараховано"
                    : "Перевірте вибір і відправте"
                : pickedHere
                  ? "Вибір збережено в чернетці"
                  : "Оберіть одного номінанта"}
            </span>
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="vc-mono min-h-[52px] cursor-pointer border border-[var(--vc-line)] px-5 text-[13px] text-[var(--vc-fg)] hover:border-[var(--vc-fg)]"
              >
                ← НАЗАД
              </button>
            )}
            {isSummary ? (
              <button
                type="button"
                onClick={send}
                disabled={submit.busy || pickedCount === 0 || (!dirty && Object.keys(saved).length > 0)}
                className="vc-display min-h-[52px] cursor-pointer bg-[var(--vc-accent)] px-7 text-sm font-bold uppercase text-[var(--vc-bg)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submit.busy
                  ? "Зберігаємо…"
                  : !user
                    ? "Увійти й відправити"
                    : Object.keys(saved).length
                      ? "Оновити вибір"
                      : "Проголосувати"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                className="vc-display min-h-[52px] cursor-pointer bg-[var(--vc-accent)] px-7 text-sm font-bold uppercase text-[var(--vc-bg)]"
              >
                {step === total - 1 ? "Мій вибір →" : pickedHere ? "Далі →" : "Пропустити →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
