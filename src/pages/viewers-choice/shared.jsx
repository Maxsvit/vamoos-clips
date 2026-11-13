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
