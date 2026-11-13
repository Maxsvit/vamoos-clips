import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../lib/apiOrigin";
import { Avatar, Marquee, VcHeader, VcState } from "./shared";
import { pad2 } from "./vcData";

const RUNNERS_UP = 4;

function votesWord(n) {
  const k = n % 10;
  const k100 = n % 100;
  if (k === 1 && k100 !== 11) return "голос";
  if (k >= 2 && k <= 4 && (k100 < 12 || k100 > 14)) return "голоси";
  return "голосів";
}
const fmt = (n) => Number(n || 0).toLocaleString("uk-UA");

export default function ViewersChoiceResults() {
  const [state, setState] = useState({ loading: true, hidden: false, error: "", data: null });
  const [open, setOpen] = useState(() => new Set());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(apiUrl("/api/vc/results"), { credentials: "include" });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        if (r.status === 403 && j.hidden) {
          setState({ loading: false, hidden: true, error: j.error, data: null });
          return;
        }
        if (!r.ok || !j.success) throw new Error(j.error || "Помилка завантаження");
        setState({ loading: false, hidden: false, error: "", data: j });
      } catch (e) {
        if (alive) setState({ loading: false, hidden: false, error: e.message, data: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (id) =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const { data } = state;

  return (
    <div className="vc-root">
      <Marquee
        items={
          data && !data.preview
            ? ["РЕЗУЛЬТАТИ ОГОЛОШЕНО", "VIEWERS CHOICE 2026", "ДЯКУЄМО ЗА ГОЛОСИ"]
            : ["VIEWERS CHOICE 2026", "РЕЗУЛЬТАТИ — ПІСЛЯ ЦЕРЕМОНІЇ НА СТРИМІ"]
        }
      />
      <VcHeader isAdmin={!!data?.isAdmin} />

      {state.loading && <VcState title="Завантаження…" />}
      {state.hidden && (
        <VcState title="Ще рано" text={state.error}>
          <Link
            to="/viewers-choice/vote"
            className="vc-display inline-flex min-h-[52px] w-fit items-center bg-[var(--vc-accent)] px-7 text-sm font-bold uppercase text-[var(--vc-bg)] no-underline"
          >
            До голосування →
          </Link>
        </VcState>
      )}
      {state.error && !state.hidden && <VcState title="Щось пішло не так" text={state.error} />}

      {data && (
        <>
          {data.preview && (
            <div className="vc-mono border-b border-[var(--vc-line)] bg-[#1d1a0a] px-4 py-3 text-center text-[13px] text-[#ffe28a]">
              ПОПЕРЕДНІЙ ПЕРЕГЛЯД ДЛЯ АДМІНІВ: ГЛЯДАЧІ ЦЬОГО ЩЕ НЕ БАЧАТЬ
            </div>
          )}

          <section className="border-b border-[var(--vc-line)]">
            <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 pb-12 pt-16 sm:px-6">
              <span className="vc-mono text-[13px] text-[var(--vc-accent)]">[ ФІНАЛ ] РЕЗУЛЬТАТИ ГОЛОСУВАННЯ</span>
              <h1 className="vc-display m-0 text-[clamp(40px,7.6vw,108px)] font-black uppercase leading-[1.12] tracking-[-0.05em]">
                Перемо&shy;жці <span className="text-[var(--vc-accent)]">26</span>
              </h1>
            </div>
          </section>

          {/* Загальна статистика */}
          <section className="border-b border-[var(--vc-line)]" aria-label="Статистика голосування">
            <div className="mx-auto grid max-w-[1320px] grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
              {[
                [fmt(data.totalBallots), "ГЛЯДАЧІВ", "проголосувало"],
                [fmt(data.totalVotes), "ГОЛОСІВ УСЬОГО", "у всіх категоріях"],
                [String(data.avgPicksPerBallot).replace(".", ","), "У СЕРЕДНЬОМУ", "категорій на глядача"],
                data.closestRace
                  ? [
                      `${data.closestRace.margin}`,
                      "НАЙЩІЛЬНІША БОРОТЬБА",
                      `${data.closestRace.title}: різниця ${data.closestRace.margin} ${votesWord(data.closestRace.margin)}`,
                    ]
                  : [pad2(data.categories.length), "НОМІНАЦІЙ", "у цьому році"],
              ].map(([value, label, hint], i) => (
                <div
                  key={label}
                  className={`flex flex-col gap-1.5 border-[var(--vc-line)] px-4 py-6 sm:px-5 ${i % 2 === 0 ? "border-r" : ""} ${
                    i < 2 ? "border-b lg:border-b-0" : ""
                  } lg:border-r`}
                >
                  <span className="vc-display text-[clamp(28px,3.4vw,44px)] font-black leading-none tracking-[-0.03em]">{value}</span>
                  <span className="vc-mono text-[11px] text-[var(--vc-accent)]">{label}</span>
                  <span className="text-[13px] text-[var(--vc-muted)]">{hint}</span>
                </div>
              ))}
            </div>
          </section>

          {data.isAdmin && (
            <div className="vc-mono mx-auto flex max-w-[1320px] flex-wrap items-center gap-3 px-4 pt-6 text-[13px] sm:px-6">
              <span className="text-[var(--vc-muted)]">ЗАВАНТАЖИТИ ДЛЯ EXCEL / GOOGLE ТАБЛИЦЬ:</span>
              <a
                href={apiUrl("/api/vc/admin/export/results.csv")}
                className="inline-flex min-h-[40px] items-center border border-[var(--vc-line)] px-3 no-underline hover:border-[var(--vc-fg)]"
              >
                ПІДСУМКИ .CSV ↓
              </a>
              <a
                href={apiUrl("/api/vc/admin/export/ballots.csv")}
                className="inline-flex min-h-[40px] items-center border border-[var(--vc-line)] px-3 no-underline hover:border-[var(--vc-fg)]"
              >
                ХТО ЗА КОГО .CSV ↓
              </a>
            </div>
          )}

          <main className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-6">
            {data.categories.map((c, i) => {
              const [winner, ...rest] = c.ranking;
              const runners = rest.slice(0, RUNNERS_UP);
              const top = winner?.votes || 1;
              const isOpen = open.has(c.id);
              return (
                <section key={c.id} className="border-b border-[var(--vc-line)]">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="flex flex-col gap-5 py-10 lg:border-r lg:border-[var(--vc-line)] lg:pr-8">
                      <span className="vc-mono text-[13px] text-[var(--vc-muted)]">
                        {pad2(i + 1)} / {c.title.toUpperCase()}
                      </span>
                      <span className="vc-mono -mt-3 text-xs text-[var(--vc-dim)]">
                        {fmt(c.totalVotes)} {votesWord(c.totalVotes).toUpperCase()} · {c.nomineesWithVotes} НОМІНАНТІВ З ГОЛОСАМИ ·{" "}
                        {String(c.participationPct).replace(".", ",")}% ГЛЯДАЧІВ ГОЛОСУВАЛИ ТУТ
                      </span>
                      {winner ? (
                        <div className="flex items-stretch bg-[var(--vc-accent)] text-[var(--vc-bg)]">
                          <Avatar
                            src={winner.avatarUrl}
                            label={winner.login}
                            className="aspect-square w-[120px] shrink-0 border-r border-[var(--vc-bg)] text-4xl sm:w-[140px]"
                          />
                          <div className="flex min-w-0 flex-col justify-between gap-3 p-5">
                            <span className="vc-mono text-xs">★ ПЕРЕМОЖЕЦЬ</span>
                            <a
                              href={`https://twitch.tv/${winner.login}`}
                              target="_blank"
                              rel="noreferrer"
                              className="vc-display truncate text-[clamp(22px,2.6vw,34px)] font-black uppercase leading-none tracking-[-0.03em] text-[var(--vc-bg)] no-underline hover:underline"
                            >
                              {winner.displayName || winner.login}
                            </a>
                            <span className="vc-mono text-sm">
                              {fmt(winner.votes)} {votesWord(winner.votes).toUpperCase()} · {String(winner.pct).replace(".", ",")}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="vc-mono m-0 text-sm text-[var(--vc-muted)]">У ЦІЙ КАТЕГОРІЇ ГОЛОСІВ НЕМАЄ</p>
                      )}
                    </div>

                    <ol className="m-0 flex list-none flex-col justify-end py-0 pb-6 lg:py-10 lg:pl-8">
                      {runners.map((r) => (
                        <Line key={r.login} r={r} top={top} />
                      ))}
                    </ol>
                  </div>

                  {c.ranking.length > 1 + RUNNERS_UP && (
                    <div className="pb-8">
                      <button
                        type="button"
                        onClick={() => toggle(c.id)}
                        aria-expanded={isOpen}
                        className="vc-mono min-h-[44px] cursor-pointer border border-[var(--vc-line)] px-4 text-xs text-[var(--vc-fg)] hover:border-[var(--vc-fg)]"
                      >
                        {isOpen ? "СХОВАТИ ПОВНУ СТАТИСТИКУ ↑" : `ПОВНА СТАТИСТИКА: УСІ ${c.ranking.length} НОМІНАНТІВ ↓`}
                      </button>
                      {isOpen && (
                        <ol className="m-0 mt-4 grid list-none grid-cols-1 gap-x-8 p-0 lg:grid-cols-2">
                          {c.ranking.map((r) => (
                            <Line key={r.login} r={r} top={top} compact />
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </main>
        </>
      )}
    </div>
  );
}

function Line({ r, top, compact = false }) {
  return (
    <li className={`grid grid-cols-[44px_36px_minmax(0,1fr)_auto] items-center gap-4 border-t border-[var(--vc-line)] ${compact ? "py-2.5" : "py-3.5"}`}>
      <span className="vc-mono text-[13px] text-[var(--vc-muted)]">#{pad2(r.place)}</span>
      <Avatar src={r.avatarUrl} label={r.login} className="h-9 w-9 text-xs" />
      <span className="flex min-w-0 flex-col gap-2">
        <span className="vc-display truncate text-[15px] font-bold uppercase">{r.displayName || r.login}</span>
        <span className="h-1 bg-[#1f1f1d]">
          <span className="block h-full bg-[var(--vc-fg)]" style={{ width: `${Math.max(2, (r.votes / top) * 100)}%` }} />
        </span>
      </span>
      <span className="vc-mono text-right text-[13px] text-[#c9c9c5]">
        {fmt(r.votes)} <span className="text-[var(--vc-muted)]">· {String(r.pct).replace(".", ",")}%</span>
      </span>
    </li>
  );
}
