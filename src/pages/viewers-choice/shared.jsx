import { useState } from "react";
import SiteHeader, { TwitchLoginButton } from "../../components/SiteHeader";

export function Marquee({ items }) {
  const text = items.join(" ✦ ") + " ✦ ";
  return (
    <div
      className="overflow-hidden whitespace-nowrap bg-[var(--vc-accent)] py-2.5 text-[13px] font-bold tracking-[0.04em] text-[var(--vc-bg)] vc-display"
      aria-hidden="true"
    >
      <div className="vc-marquee-track">
        <span className="pr-0">{text.repeat(4)}</span>
        <span className="pr-0">{text.repeat(4)}</span>
      </div>
    </div>
  );
}

/** Шапка сайту з кнопкою входу (на сторінках Viewers Choice вона потрібна завжди). */
export function VcHeader({ isAdmin = false }) {
  return <SiteHeader isAdmin={isAdmin} showLogin />;
}

export { TwitchLoginButton };

export function Avatar({ src, label, className = "", imgClassName = "" }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span
        className={`vc-display flex items-center justify-center bg-[#1b1b19] font-black uppercase text-[#3a3a37] ${className}`}
        aria-hidden="true"
      >
        {String(label || "?").slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className={`object-cover ${className} ${imgClassName}`}
    />
  );
}

export function VcState({ title, text, children }) {
  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 py-24 sm:px-6">
      <h1 className="vc-display m-0 text-[clamp(32px,5vw,64px)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
        {title}
      </h1>
      {text && <p className="m-0 max-w-[560px] text-[17px] text-[var(--vc-muted)]">{text}</p>}
      {children}
    </div>
  );
}

/** Плашка для адмінів, поки глядачі бачать лише «Скоро». */
export function SoonPreviewBanner() {
  return (
    <div className="vc-mono border-b border-[var(--vc-line)] bg-[#1d1a0a] px-4 py-3 text-center text-[13px] text-[#ffe28a]">
      ПРЕВ’Ю ДЛЯ АДМІНІВ: ГЛЯДАЧІ ЗАРАЗ БАЧАТЬ «СКОРО». ЩОБ ВІДКРИТИ ГОЛОСУВАННЯ, ПОСТАВТЕ VC_PHASE=voting
    </div>
  );
}

/** Тизер «Скоро» для глядачів до старту голосування. */
export function VcSoon() {
  return (
    <div className="vc-root">
      <Marquee items={["VIEWERS CHOICE 2026", "СКОРО", "НАРОДНЕ ГОЛОСУВАННЯ ЗА СТРІМЕРІВ РОКУ", "СКОРО"]} />
      <VcHeader />
      <section className="mx-auto flex max-w-[1320px] flex-col gap-10 px-4 pb-20 pt-16 sm:px-6 sm:pt-20">
        <span className="vc-mono text-[13px] text-[var(--vc-muted)]">[ ВИПУСК 02 ] ЩОРІЧНА ЦЕРЕМОНІЯ КАНАЛУ</span>
        <h1 className="vc-display m-0 text-[clamp(40px,8.6vw,124px)] font-black uppercase leading-[1.12] tracking-[-0.05em]">
          <span className="mb-[0.12em] block text-[0.42em] leading-none tracking-[-0.03em]">Народний</span>
          Viewers
          <br />
          <span className="text-[var(--vc-accent)]">Choice</span> 26
        </h1>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <p className="m-0 max-w-[520px] text-lg leading-relaxed text-[#c9c9c5]">
            Голосування за найкращих стрімерів року стартує зовсім скоро. Слідкуй за анонсами на стримі та в
            наших соцмережах, щоб не пропустити старт.
          </p>
          <div className="vc-display flex min-h-[72px] items-center border border-[var(--vc-line)] px-7 text-[15px] font-bold uppercase">
            Скоро <span className="ml-2 text-[var(--vc-accent)]">●</span>
          </div>
        </div>
      </section>
    </div>
  );
}
