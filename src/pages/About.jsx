import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { SOCIALS } from "../lib/socials";

const PROJECTS = [
  {
    tag: "САЙТ",
    title: "Кліпи українського Twitch",
    text: "Архів найкращих моментів, які надсилаєте ви. З них збираємо добірки для YouTube.",
    to: "/",
    cta: "ДИВИТИСЬ КЛІПИ",
  },
  {
    tag: "ЩОРІЧНО",
    title: "Народний Viewers Choice",
    text: "Голосування глядачів за найкращих стрімерів року в різних номінаціях.",
    to: "/viewers-choice",
    cta: "ДО ГОЛОСУВАННЯ",
  },
  {
    tag: "ПРОЄКТ",
    title: "Vyklav",
    text: "Ще один наш проєкт.",
    href: "https://vyklav.com/",
    cta: "VYKLAV.COM",
  },
];

export default function About() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("themainview@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не вдалося скопіювати:", err);
    }
  };

  return (
    <div className="vc-root">
      <section className="border-b border-[var(--vc-line)]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
          <span className="vc-mono text-[13px] text-[var(--vc-accent)]">[ ПРО НАС ] VAMOOS NARIZKY</span>
          <h1 className="vc-display m-0 text-[clamp(36px,6.4vw,92px)] font-black uppercase leading-[1.12] tracking-[-0.045em]">
            Про <span className="text-[var(--vc-accent)]">нас</span>
          </h1>
          <p className="m-0 max-w-[680px] text-lg leading-relaxed text-[#c9c9c5]">
            Ми збираємо найкращі моменти українського Twitch: нарізки, добірки та щорічне голосування глядачів. Наша
            мета: зробити зручний майданчик для обміну кліпами й перегляду цікавого українського контенту.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6">
        <h2 className="vc-display m-0 pb-6 text-[clamp(28px,3.4vw,48px)] font-black uppercase leading-[1.12] tracking-[-0.03em]">
          Наші проєкти
        </h2>
        <div className="grid grid-cols-1 border-l border-t border-[var(--vc-line)] md:grid-cols-3">
          {PROJECTS.map((p) => {
            const cls =
              "group flex min-h-[240px] flex-col gap-4 border-b border-r border-[var(--vc-line)] p-6 text-[var(--vc-fg)] no-underline hover:bg-[#151515]";
            const inner = (
              <>
                <span className="vc-mono text-xs text-[var(--vc-accent)]">[ {p.tag} ]</span>
                <span className="vc-display text-2xl font-black uppercase leading-tight tracking-[-0.02em]">{p.title}</span>
                <span className="text-[15px] leading-relaxed text-[var(--vc-muted)]">{p.text}</span>
                <span className="vc-mono mt-auto text-[13px] group-hover:text-[var(--vc-accent)]">
                  {p.cta} {p.href ? "↗" : "→"}
                </span>
              </>
            );
            return p.href ? (
              <a key={p.title} href={p.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={p.title} to={p.to} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 pb-14 sm:px-6">
        <h2 className="vc-display m-0 pb-6 text-[clamp(28px,3.4vw,48px)] font-black uppercase leading-[1.12] tracking-[-0.03em]">
          Соцмережі
        </h2>
        <div className="border-t border-[var(--vc-line)]">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--vc-line)] py-5 text-[var(--vc-fg)] no-underline sm:grid-cols-[200px_minmax(0,1fr)_auto]"
            >
              <span className="vc-display text-[clamp(22px,2.6vw,32px)] font-black uppercase tracking-[-0.02em] group-hover:text-[var(--vc-accent)]">
                {s.label}
              </span>
              <span className="vc-mono hidden truncate text-[13px] text-[var(--vc-muted)] sm:block">{s.handle}</span>
              <span className="vc-mono text-[13px]">ПЕРЕЙТИ ↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--vc-line)]">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-8 px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex min-w-0 max-w-[640px] flex-col gap-5">
            <span className="vc-mono text-[13px] text-[var(--vc-accent)]">[ КОНТАКТИ ] ПИШИ НАМ</span>
            <h2 className="vc-display m-0 text-[clamp(28px,3.6vw,52px)] font-black uppercase leading-[1.12] tracking-[-0.035em]">
              Хочеш співпрацювати?
            </h2>
            <p className="m-0 text-[17px] text-[var(--vc-muted)]">Якщо маєш питання або ідеї, напиши нам у зручний спосіб.</p>
          </div>
          <div className="flex flex-wrap border border-[var(--vc-line)]">
            <a
              href="https://t.me/vamoosmax"
              target="_blank"
              rel="noopener noreferrer"
              className="vc-display flex min-h-[64px] items-center bg-[var(--vc-accent)] px-7 text-[15px] font-bold uppercase text-[var(--vc-bg)] no-underline"
            >
              Telegram ↗
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="vc-mono flex min-h-[64px] cursor-pointer items-center px-6 text-[13px] text-[var(--vc-fg)] hover:bg-[#151515]"
              aria-live="polite"
            >
              {copied ? "● EMAIL СКОПІЙОВАНО" : "THEMAINVIEW@GMAIL.COM ⧉"}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
