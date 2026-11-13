import { Link } from "react-router-dom";
import { DONATE_URL } from "./SiteHeader";
import { SOCIALS } from "../lib/socials";


export default function Footer() {
  return (
    <footer className="border-t border-[var(--vc-line)] bg-[var(--vc-bg)] text-[var(--vc-fg)]">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-4">
          <Link
            to="/"
            className="vc-display text-[clamp(28px,4vw,48px)] font-black uppercase leading-none tracking-[-0.03em] text-[var(--vc-fg)] no-underline"
          >
            Vamoos<span className="text-[var(--vc-accent)]">/</span>Narizky
          </Link>
          <p className="m-0 max-w-[420px] text-[15px] text-[var(--vc-muted)]">
            Найкращі моменти з українського Twitch: кліпи, добірки та щорічний Viewers Choice.
          </p>
        </div>
        <nav className="vc-mono flex flex-wrap gap-x-8 gap-y-3 self-end text-[13px]" aria-label="Соцмережі">
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="text-[var(--vc-muted)] no-underline hover:text-[var(--vc-accent)]">
              {s.label.toUpperCase()} ↗
            </a>
          ))}
          <a href={DONATE_URL} target="_blank" rel="noreferrer" className="text-[var(--vc-muted)] no-underline hover:text-[var(--vc-accent)]">
            ПІДТРИМАТИ ↗
          </a>
        </nav>
      </div>
      <div className="vc-mono mx-auto flex max-w-[1320px] flex-wrap justify-between gap-3 border-t border-[var(--vc-line)] px-4 py-5 text-xs text-[var(--vc-dim)] sm:px-6">
        <span>© {new Date().getFullYear()} VAMOOS NARIZKY</span>
        <span>ЗРОБЛЕНО ДЛЯ УКРАЇНСЬКОГО TWITCH</span>
      </div>
    </footer>
  );
}
