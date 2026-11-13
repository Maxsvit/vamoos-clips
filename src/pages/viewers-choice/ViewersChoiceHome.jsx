import { Link } from "react-router-dom";
import { Avatar, Marquee, VcHeader, VcState } from "./shared";
import { formatDeadline, pad2, useCountdown, useVcEvent } from "./vcData";

/** Лише два етапи: голосування, а одразу після нього — оголошення переможців. */
const STAGES = [
  { key: "voting", title: "Голосування й висування" },
  { key: "results", title: "Оголошення переможців" },
];

function stageState(stageIdx, phase) {
  const current = phase === "voting" ? 0 : 1;
  if (stageIdx < current) return "done";
  if (stageIdx === current) return "now";
  return "next";
}

export default function ViewersChoiceHome() {
  const { loading, error, data } = useVcEvent();
  const event = data?.event;
  const cd = useCountdown(event?.phase === "voting" ? event?.votingDeadline : null);
  const deadline = formatDeadline(event?.votingDeadline);
  const ballot = data?.me?.ballot;
  const pickedCount = ballot ? Object.keys(ballot.picks || {}).length : 0;

  const marquee =
    event?.phase === "results"
      ? ["РЕЗУЛЬТАТИ ОГОЛОШЕНО", "VIEWERS CHOICE 2026", "ДЯКУЄМО ЗА ГОЛОСИ"]
      : event?.phase === "closed"
        ? ["ГОЛОСУВАННЯ ЗАВЕРШЕНО", "VIEWERS CHOICE 2026", "ЧЕКАЙТЕ ЦЕРЕМОНІЮ НА СТРИМІ"]
        : ["VIEWERS CHOICE 2026", "ГОЛОСУВАННЯ ТРИВАЄ", deadline ? `ДО ${deadline.toUpperCase()}` : "", "ОДИН ГОЛОС У КОЖНІЙ КАТЕГОРІЇ"].filter(Boolean);

  return (
    <div className="vc-root">
      <Marquee items={marquee} />
      <VcHeader isAdmin={!!data?.me?.isAdmin} />

      {loading && <VcState title="Завантаження…" />}
      {error && <VcState title="Щось пішло не так" text={error} />}

      {data && (
        <>
          <section className="border-b border-[var(--vc-line)]">
            <div className="mx-auto flex max-w-[1320px] flex-col gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
              <div className="vc-mono flex flex-wrap justify-between gap-4 text-[13px] text-[var(--vc-muted)]">
                <span>[ ВИПУСК 02 ] ЩОРІЧНА ЦЕРЕМОНІЯ КАНАЛУ</span>
                <span>ГОЛОСУЮТЬ ГЛЯДАЧІ, А НЕ ЖУРІ</span>
              </div>
              <h1 className="vc-display m-0 text-[clamp(40px,8.6vw,124px)] font-black uppercase leading-[1.12] tracking-[-0.05em]">
                <span className="mb-[0.12em] block text-[0.42em] leading-none tracking-[-0.03em]">Народний</span>
                Viewers
                <br />
                <span className="text-[var(--vc-accent)]">Choice</span> 26
              </h1>
              <div className="flex flex-wrap items-end justify-between gap-8">
                <p className="m-0 max-w-[460px] text-lg leading-relaxed text-[#c9c9c5]">
                  Ви обираєте найкращих стримерів року. Один голос у кожній категорії,
                  вибір можна змінити до кінця голосування.
                </p>
                <div className="flex flex-wrap border border-[var(--vc-line)]">
                  {cd &&
                    [
                      [cd.d, "ДНІВ"],
                      [cd.h, "ГОДИН"],
                      [cd.m, "ХВИЛИН"],
                    ].map(([v, l]) => (
                      <div key={l} className="border-r border-[var(--vc-line)] px-5 py-3.5">
                        <div className="vc-display text-4xl font-black tracking-[-0.03em]">{pad2(v)}</div>
                        <div className="vc-mono text-[11px] text-[var(--vc-muted)]">{l}</div>
                      </div>
                    ))}
                  {event.phase === "voting" ? (
                    <Link
                      to="/viewers-choice/vote"
                      className="vc-display flex min-h-[72px] items-center bg-[var(--vc-accent)] px-7 text-[15px] font-bold uppercase text-[var(--vc-bg)] no-underline"
                    >
                      {pickedCount ? "Змінити вибір →" : "Голосувати →"}
                    </Link>
                  ) : (
                    <Link
                      to="/viewers-choice/results"
                      className="vc-display flex min-h-[72px] items-center bg-[var(--vc-accent)] px-7 text-[15px] font-bold uppercase text-[var(--vc-bg)] no-underline"
                    >
                      Результати →
                    </Link>
                  )}
                </div>
              </div>
              {pickedCount > 0 && event.phase === "voting" && (
                <p className="vc-mono m-0 text-[13px] text-[var(--vc-accent)]">
                  ● ВАШ ГОЛОС ЗАРАХОВАНО: {pickedCount}/{data.categories.length} КАТЕГОРІЙ
                </p>
              )}
            </div>
          </section>

          <section className="border-b border-[var(--vc-line)]">
            <ol className="mx-auto grid max-w-[1320px] list-none grid-cols-1 px-4 sm:grid-cols-2 sm:px-6">
              {STAGES.map((s, i) => {
                const st = stageState(i, event.phase);
                return (
                  <li
                    key={s.key}
                    className={`flex flex-col gap-2 border-b border-[var(--vc-line)] px-5 py-6 sm:border-b-0 sm:border-r ${
                      st === "now"
                        ? "bg-[var(--vc-accent)] text-[var(--vc-bg)]"
                        : st === "done"
                          ? "text-[var(--vc-dim)]"
                          : "text-[var(--vc-muted)]"
                    }`}
                  >
                    <span className="vc-mono text-xs">
                      {pad2(i + 1)}{" "}
                      {st === "done"
                        ? "✓ ЗАВЕРШЕНО"
                        : st === "now"
                          ? s.key === "voting" && deadline
                            ? `● ЗАРАЗ · ДО ${deadline.toUpperCase()}`
                            : "● ЗАРАЗ"
                          : deadline
                            ? `○ ОДРАЗУ ПІСЛЯ ${deadline.toUpperCase()}`
                            : "○ ПОПЕРЕДУ"}
                    </span>
                    <span className={`vc-display text-base font-bold uppercase ${st === "next" ? "text-[var(--vc-fg)]" : ""}`}>
                      {s.title}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="mx-auto max-w-[1320px] px-4 pb-6 pt-16 sm:px-6 sm:pt-20">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
              <h2 className="vc-display m-0 text-[clamp(28px,3.4vw,48px)] font-black uppercase leading-[1.12] tracking-[-0.03em]">
                Номінації
              </h2>
              <span className="vc-mono text-[13px] text-[var(--vc-muted)]">
                [ {pad2(data.categories.length)} КАТЕГОРІЙ ]
              </span>
            </div>
            <div className="border-t border-[var(--vc-line)]">
              {data.categories.map((c, i) => {
                const picked = ballot?.picks?.[c.id];
                const preview = c.nominees.slice(0, 3);
                return (
                  <Link
                    key={c.id}
                    to={`/viewers-choice/vote?c=${encodeURIComponent(c.id)}`}
                    className="group grid grid-cols-[48px_minmax(0,1fr)] items-center gap-x-6 gap-y-4 border-b border-[var(--vc-line)] py-7 text-[var(--vc-fg)] no-underline sm:grid-cols-[80px_minmax(0,1fr)_auto]"
                  >
                    <span className="vc-mono text-sm text-[var(--vc-accent)]">{pad2(i + 1)}</span>
                    <span className="flex min-w-0 flex-col gap-1.5">
                      <span className="vc-display text-[clamp(22px,3.2vw,44px)] font-black uppercase leading-none tracking-[-0.03em] group-hover:text-[var(--vc-accent)]">
                        {c.title}
                      </span>
                      {picked && (
                        <span className="vc-mono text-xs text-[var(--vc-accent)]">● ВАШ ГОЛОС: {picked}</span>
                      )}
                    </span>
                    <span className="col-start-2 flex items-center gap-4 sm:col-start-auto">
                      <span className="flex" aria-hidden="true">
                        {preview.map((n, k) => (
                          <Avatar
                            key={n.login}
                            src={n.avatarUrl}
                            label={n.login}
                            className={`h-9 w-9 border border-[var(--vc-bg)] text-[11px] ${k ? "-ml-2" : ""}`}
                          />
                        ))}
                        <span className="vc-mono -ml-2 flex h-9 min-w-9 items-center justify-center border border-[var(--vc-bg)] bg-[var(--vc-accent)] px-1 text-[11px] text-[var(--vc-bg)]">
                          {c.nominees.length}
                        </span>
                      </span>
                      <span className="vc-mono text-sm">↗</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <footer className="vc-mono mx-auto flex max-w-[1320px] flex-wrap justify-between gap-4 px-4 pb-16 pt-12 text-[13px] text-[var(--vc-muted)] sm:px-6">
            <span>ПРАВИЛА: 1 АКАУНТ TWITCH = 1 ГОЛОС У КАТЕГОРІЇ</span>
            <span>АКАУНТ ТВІЧ, СТАРШИЙ ЗА {event.minAccountAgeDays} ДНІВ</span>
          </footer>
        </>
      )}
    </div>
  );
}
