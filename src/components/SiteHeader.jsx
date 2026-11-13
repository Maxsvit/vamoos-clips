import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CLIP_OF_MONTH_ENABLED, VIEWERS_CHOICE_ENABLED } from "../lib/features";
import { useVcVisible } from "../lib/vcStatus";

export const DONATE_URL = "https://send.monobank.ua/jar/2a8TQ3Q4UJ";

export function TwitchLoginButton({ onClick, accent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`vc-mono inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 px-4 text-[13px] ${
        accent
          ? "bg-[var(--vc-accent)] font-bold text-[var(--vc-bg)]"
          : "border border-[var(--vc-fg)] text-[var(--vc-fg)] hover:bg-[var(--vc-fg)] hover:text-[var(--vc-bg)]"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 2H3v16h5v4l4-4h5l4-4V2z" />
        <path d="M11 7v4" />
        <path d="M16 7v4" />
      </svg>
      УВІЙТИ ЧЕРЕЗ TWITCH
    </button>
  );
}

/** Шапка сайту: однакова на всіх сторінках. */
export default function SiteHeader({ isAdmin = false, showLogin = false }) {
  const { user, loading, login, logout } = useAuth();
  const vc = useVcVisible(user?.id ? String(user.id) : "");
  const showAdmin = isAdmin || vc.isAdmin;
  const [open, setOpen] = useState(false);

  const link = ({ isActive }) =>
    `no-underline ${isActive ? "text-[var(--vc-accent)]" : "text-[var(--vc-muted)] hover:text-[var(--vc-fg)]"}`;
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--vc-line)] bg-[var(--vc-bg)]">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <NavLink
          to="/"
          onClick={close}
          className="vc-display text-lg font-black uppercase tracking-[-0.01em] text-[var(--vc-fg)] no-underline"
        >
          Vamoos<span className="text-[var(--vc-accent)]">/</span>Narizky
        </NavLink>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-nav"
          className="vc-mono min-h-[44px] cursor-pointer border border-[var(--vc-line)] px-4 text-[13px] text-[var(--vc-fg)] lg:hidden"
        >
          {open ? "ЗАКРИТИ ✕" : "МЕНЮ ☰"}
        </button>

        <nav
          id="site-nav"
          aria-label="Розділи сайту"
          className={`${open ? "flex" : "hidden"} vc-mono w-full flex-col gap-4 border-t border-[var(--vc-line)] pt-4 text-[13px] lg:flex lg:w-auto lg:flex-row lg:items-center lg:gap-6 lg:border-0 lg:pt-0`}
        >
          <NavLink to="/" end className={link} onClick={close}>КЛІПИ</NavLink>
          <NavLink to="/submit" className={link} onClick={close}>ДОДАТИ КЛІП</NavLink>
          {CLIP_OF_MONTH_ENABLED && (
            <NavLink to="/clip-of-month" className={link} onClick={close}>КЛІП МІСЯЦЯ</NavLink>
          )}
          {VIEWERS_CHOICE_ENABLED && vc.visible && (
            <NavLink to="/viewers-choice" className={link} onClick={close}>VIEWERS CHOICE ’26</NavLink>
          )}
          <NavLink to="/about" className={link} onClick={close}>ПРО НАС</NavLink>
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--vc-muted)] no-underline hover:text-[var(--vc-fg)]">
            ПІДТРИМАТИ ↗
          </a>
          {showAdmin && (
            <NavLink to="/viewers-choice/admin" className={link} onClick={close}>АДМІНКА</NavLink>
          )}

          {!loading &&
            (user ? (
              <span className="flex min-h-[44px] w-fit items-center gap-3 border border-[var(--vc-line)] px-3">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="h-7 w-7 object-cover" />
                ) : (
                  <span className="h-2 w-2 bg-[var(--vc-accent)]" />
                )}
                <span className="max-w-[140px] truncate text-[var(--vc-fg)]">{user.displayName}</span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="cursor-pointer text-[var(--vc-muted)] hover:text-[var(--vc-fg)]"
                >
                  ВИЙТИ
                </button>
              </span>
            ) : showLogin ? (
              <span className="w-fit">
                <TwitchLoginButton onClick={login} />
              </span>
            ) : null)}
        </nav>
      </div>
    </header>
  );
}
