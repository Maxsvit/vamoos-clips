import { useState } from "react";
import { apiUrl } from "../../lib/apiOrigin";
import { TwitchLoginButton } from "./shared";

/** «Немає твого стрімера? Додай» — висування глядачами. */
export default function AddStreamer({ category, user, onLogin, onAdded, threshold, initialQuery = "", empty = false }) {
  const [value, setValue] = useState(initialQuery);
  const [state, setState] = useState({ busy: false, error: "", note: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      onLogin();
      return;
    }
    setState({ busy: true, error: "", note: "" });
    try {
      const r = await fetch(apiUrl("/api/vc/nominate"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: category.id, login: value }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        onLogin();
        return;
      }
      if (!r.ok || !j.success) throw new Error(j.error || "Не вдалося додати");
      const name = j.nominee.displayName || j.nominee.login;
      const note =
        j.status === "exists"
          ? `${name} уже є в списку. Обрали його для вас.`
          : j.status === "visible"
            ? `${name} тепер у списку для всіх. Ваш голос за нього вже у вашому виборі.`
            : j.status === "needs_more"
              ? `${name} доданий і обраний у вашому виборі. Іншим глядачам він з'явиться, коли його додадуть ще ${Math.max(0, threshold - j.count)}.`
              : `${name} доданий і обраний, але канал не україномовний, тож іншим він з'явиться після перевірки модератором.`;
      setValue("");
      setState({ busy: false, error: "", note });
      onAdded(j.nominee.login);
    } catch (err) {
      setState({ busy: false, error: err.message, note: "" });
    }
  };

  return (
    <section className="flex flex-col gap-4 border border-t-0 border-[var(--vc-line)] p-5 sm:p-6" aria-label="Додати стрімера">
      <div className="flex flex-col gap-1.5">
        <h2 className="vc-display m-0 text-lg font-bold uppercase">
          {empty ? "Тут поки порожньо: додай першим" : "Немає твого стрімера? Додай"}
        </h2>
        <p className="m-0 text-sm text-[var(--vc-muted)]">
          Впиши нік або посилання на канал Twitch. Ти одразу зможеш за нього проголосувати, а для всіх він
          з'явиться, коли його додадуть {threshold} різних глядачі.
        </p>
      </div>
      {user ? (
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <label className="flex min-h-[52px] min-w-0 flex-1 basis-[260px] items-center gap-3 border border-[var(--vc-line)] px-4 focus-within:border-[var(--vc-muted)]">
            <span className="vc-mono text-xs text-[var(--vc-muted)]">TWITCH.TV/</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="нік_стрімера"
              autoComplete="off"
              spellCheck="false"
              className="vc-mono min-w-0 flex-1 bg-transparent text-sm text-[var(--vc-fg)] outline-none placeholder:text-[var(--vc-dim)] focus-visible:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={state.busy || !value.trim()}
            className="vc-display min-h-[52px] cursor-pointer bg-[var(--vc-accent)] px-6 text-sm font-bold uppercase text-[var(--vc-bg)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.busy ? "Перевіряємо…" : "Додати"}
          </button>
        </form>
      ) : (
        <div>
          <TwitchLoginButton onClick={onLogin} accent />
        </div>
      )}
      {state.note && (
        <p className="vc-mono m-0 text-[13px] text-[var(--vc-accent)]" role="status">
          ● {state.note}
        </p>
      )}
      {state.error && (
        <p className="vc-mono m-0 text-[13px] text-[#ff8a7a]" role="alert">
          ✕ {state.error}
        </p>
      )}
    </section>
  );
}
