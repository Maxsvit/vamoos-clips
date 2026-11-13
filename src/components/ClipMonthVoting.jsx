import { useCallback, useEffect, useState } from "react";
import ClipCard, { getClipSlug } from "./ClipCard";
import { useAuth } from "../context/AuthContext";
import { apiUrl } from "../lib/apiOrigin";

/** Макс. кліпів у пулі (захист, якщо API ще старий або закешований). Має збігатися з бекендом. */
const CLIP_MONTH_POOL_MAX = 10;

/** Офіційний Twitch clip embed; parent — домен сторінки (вимога Twitch). */
function getTwitchClipEmbedUrl(slug) {
  if (!slug || typeof window === "undefined") return null;
  const u = new URL("https://clips.twitch.tv/embed");
  u.searchParams.set("clip", slug);
  u.searchParams.append("parent", window.location.hostname);
  if (window.location.hostname === "localhost") {
    u.searchParams.append("parent", "127.0.0.1");
  }
  return u.toString();
}

function orderUrlsFromVoteKeys(voteKeys, clipList) {
  if (!Array.isArray(voteKeys) || !voteKeys.length || !clipList?.length) {
    return [];
  }
  return voteKeys
    .map((k) => clipList.find((c) => c.voteKey === k)?.clipUrl)
    .filter(Boolean);
}

export default function ClipMonthVoting() {
  const { user, loading: authLoading, login } = useAuth();
  const [clips, setClips] = useState([]);
  const [picksRequired, setPicksRequired] = useState(3);
  const [selectedClipUrls, setSelectedClipUrls] = useState([]);
  const [poolSize, setPoolSize] = useState(10);
  const [roundId, setRoundId] = useState("");
  const [votesStorage, setVotesStorage] = useState("");
  /** manual = список з server/clip-month-pool.json, sheets = Google Таблиця */
  const [poolSource, setPoolSource] = useState("sheets");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  /** Попап після підтвердження голосу (успіх / помилка відправки) */
  const [voteToast, setVoteToast] = useState(null);
  /** Модалка з Twitch embed (клік по картці кліпу) */
  const [previewClip, setPreviewClip] = useState(null);
  /** У цьому раунді вже відправлено бюлетень — повтор недоступний */
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!voteToast) return;
    const id = setTimeout(() => setVoteToast(null), 5200);
    return () => clearTimeout(id);
  }, [voteToast]);

  useEffect(() => {
    if (!previewClip) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setPreviewClip(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewClip]);

  const loadBoard = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch(apiUrl("/api/clip-month/vote-board"), {
        credentials: "include",
      });
      const raw = await r.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!r.ok || !data.success) {
        const base =
          data.error ||
          (raw?.trim().startsWith("<")
            ? "Сервер повернув HTML замість JSON (часто статичний хост підсовує index.html під /api)"
            : `Запит не вдався (HTTP ${r.status})`);
        const hint =
          r.status === 404
            ? " — бекенд без маршруту: git pull, npm run server :8080 або redeploy."
            : r.status === 502 || r.status === 504
              ? " — Vite не дістався API: npm run server на 8080."
              : raw?.trim().startsWith("<")
                ? " — якщо сайт на Cloudflare/Pages тощо, задай у .env фронта VITE_API_ORIGIN=https://URL-Node-сервера і перезбери; на бекенді додай домен фронта в CORS_EXTRA_ORIGINS."
                : "";
        throw new Error(base + hint);
      }
      const rawList = Array.isArray(data.clips) ? data.clips : [];
      const list = rawList.slice(0, CLIP_MONTH_POOL_MAX);
      setClips(list);
      const pr =
        typeof data.picksRequired === "number" && data.picksRequired > 0
          ? data.picksRequired
          : 3;
      setPicksRequired(pr);
      const ps =
        typeof data.poolSize === "number" ? data.poolSize : CLIP_MONTH_POOL_MAX;
      setPoolSize(Math.min(CLIP_MONTH_POOL_MAX, ps));
      setRoundId(data.roundId || "");
      setVotesStorage(data.votesStorage || "");
      setPoolSource(data.poolSource === "manual" ? "manual" : "sheets");
      const ordered = orderUrlsFromVoteKeys(data.myVoteKeys, list);
      setSelectedClipUrls(
        ordered.length === pr && pr > 0 ? ordered : []
      );
      const myK = Array.isArray(data.myVoteKeys) ? data.myVoteKeys : [];
      setHasVoted(
        myK.length >= pr && pr > 0 && myK.every((k) => typeof k === "string")
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Помилка мережі");
      setClips([]);
      setPoolSource("sheets");
      setHasVoted(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const togglePick = (clipUrl) => {
    if (hasVoted) return;
    setSelectedClipUrls((prev) => {
      const i = prev.indexOf(clipUrl);
      if (i >= 0) {
        return prev.filter((_, j) => j !== i);
      }
      if (prev.length >= picksRequired) return prev;
      return [...prev, clipUrl];
    });
  };

  const confirmVotes = async () => {
    if (hasVoted || selectedClipUrls.length !== picksRequired) return;
    setSubmitting(true);
    setErr(null);
    try {
      const r = await fetch(apiUrl("/api/clip-month/vote"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipUrls: selectedClipUrls }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data.success === false) {
        const msg =
          (typeof data.error === "string" && data.error.trim()) ||
          "Не вдалося надіслати голос. Спробуй ще раз за хвилину.";
        setVoteToast({ variant: "error", message: msg });
        return;
      }
      if (Array.isArray(data.clips)) {
        setClips(data.clips.slice(0, CLIP_MONTH_POOL_MAX));
      }
      if (data.votesStorage) setVotesStorage(data.votesStorage);
      const ordered = orderUrlsFromVoteKeys(data.myVoteKeys, data.clips || []);
      if (ordered.length === picksRequired) {
        setSelectedClipUrls(ordered);
      }
      setHasVoted(true);
      setVoteToast({
        variant: "success",
        message:
          "Голос збережено! Дякуємо — твій вибір зараховано в цьому турі. Повторно проголосувати не можна.",
      });
    } catch (e) {
      setVoteToast({
        variant: "error",
        message:
          e instanceof Error
            ? e.message
            : "Не вдалося з'єднатися з сервером. Перевір інтернет і спробуй ще раз.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className=" bg-[#151515] border border-[var(--vc-line)] p-10 text-center text-[var(--vc-muted)] text-sm md:col-span-2">
        Завантаження списку кліпів…
      </div>
    );
  }

  if (err && clips.length === 0) {
    return (
      <div className=" bg-red-950/40 border border-[var(--vc-line)] p-6 text-center text-[#ff8a7a] text-sm md:col-span-2">
        {err}
      </div>
    );
  }

  const isPicked = (url) => selectedClipUrls.includes(url);
  const canAddMore = selectedClipUrls.length < picksRequired;
  const pickOrder = (url) => {
    const i = selectedClipUrls.indexOf(url);
    return i >= 0 ? i + 1 : null;
  };

  return (
    <div
      className={
        "md:col-span-2 space-y-8 " +
        (clips.length > 0 ? "pb-28 sm:pb-28 md:pb-0" : "")
      }
    >
      <div className="relative overflow-hidden border border-[var(--vc-line)] bg-[var(--vc-bg)] p-6 md:p-10 ">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 bg-[#151515] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 bg-violet-600/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-[var(--vc-accent)] text-xs font-semibold uppercase tracking-[0.2em]">
              Кліп місяця
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Обери свій топ із{" "}
              <span className="text-[var(--vc-accent)]">{poolSize}</span>{" "}
              {poolSource === "manual"
                ? "кліпів у цьому турі"
                : "останніх кліпів з таблиці"}
            </h3>
            <p className="text-[var(--vc-muted)] text-sm leading-relaxed">
              Відміть{" "}
              <span className="font-medium text-[var(--vc-accent)]">{picksRequired}</span>{" "}
              різні відео в сітці нижче, потім підтвердь голос. Клік по прев’ю
              відкриває плеєр тут; один Twitch-акаунт — один бюлетень за раунд, без
              повторного голосування.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 border border-white/[0.07] bg-black/30 px-5 py-4 backdrop-blur-sm sm:min-w-[12rem]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--vc-muted)]">
              Прогрес
            </p>
            <p className="text-3xl font-black tabular-nums text-[var(--vc-accent)]">
              {selectedClipUrls.length}
              <span className="text-lg font-semibold text-[var(--vc-muted)]">
                {" "}
                / {picksRequired}
              </span>
            </p>
            <p className="text-xs text-[var(--vc-muted)]">
              {selectedClipUrls.length === picksRequired
                ? "Можна підтверджувати"
                : "Ще обери кліпи"}
            </p>
          </div>
        </div>
      </div>

      {!user ? (
        <div className=" bg-[#151515] border border-[var(--vc-line)] p-8 text-center">
          <p className="text-[#c9c9c5] text-sm mb-4">
            Щоб голос зарахувався, увійди через Twitch.
          </p>
          <button
            type="button"
            onClick={login}
            className={
              "px-8 py-3 font-bold text-white inline-flex items-center gap-2 " +
              "bg-[var(--vc-accent)] text-[var(--vc-bg)] hover:brightness-110 border border-[var(--vc-line)] " +
              " transition-transform hover:scale-[1.02] active:scale-95"
            }
          >
            Увійти через Twitch
          </button>
        </div>
      ) : null}

      {err ? (
        <p className="text-center text-sm text-[#ff8a7a]">{err}</p>
      ) : null}

      {voteToast ? (
        <div
          role="alert"
          aria-live={voteToast.variant === "error" ? "assertive" : "polite"}
          className={
            "fixed bottom-6 left-1/2 z-[100] w-[min(92vw,28rem)] -translate-x-1/2 px-5 py-4   " +
            "border text-sm leading-relaxed " +
            (voteToast.variant === "success"
              ? "bg-[#151515] text-emerald-50 border-[var(--vc-line)]"
              : "bg-red-950/95 text-red-50 border-[var(--vc-line)]")
          }
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 text-left">{voteToast.message}</p>
            <button
              type="button"
              onClick={() => setVoteToast(null)}
              className="shrink-0 px-1.5 py-0.5 text-lg leading-none opacity-75 hover:opacity-100"
              aria-label="Закрити"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      {previewClip ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm"
          role="presentation"
          onClick={() => setPreviewClip(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clip-embed-dialog-title"
            className="relative w-full max-w-4xl bg-[var(--vc-bg)] border border-[var(--vc-line)] overflow-hidden flex flex-col max-h-[min(92vh,900px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/[0.08] shrink-0">
              <h2
                id="clip-embed-dialog-title"
                className="text-base sm:text-lg font-bold text-white pr-2 line-clamp-2"
              >
                {previewClip.title || "Кліп"}
              </h2>
              <button
                type="button"
                onClick={() => setPreviewClip(null)}
                className="shrink-0 px-3 py-1.5 text-2xl leading-none text-[#c9c9c5] hover:bg-[#151515] hover:text-white"
                aria-label="Закрити перегляд"
              >
                ×
              </button>
            </div>
            <div className="relative w-full aspect-video bg-black shrink-0">
              {(() => {
                const slug = getClipSlug(previewClip.clipUrl);
                const src = slug ? getTwitchClipEmbedUrl(slug) : null;
                if (src) {
                  return (
                    <iframe
                      key={slug}
                      title={previewClip.title || "Twitch clip"}
                      src={src}
                      className="absolute inset-0 h-full w-full"
                      allowFullScreen
                      allow="autoplay; fullscreen; picture-in-picture"
                    />
                  );
                }
                return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-[var(--vc-muted)] text-sm">
                    <p>Не вдалося вбудувати це посилання. Відкрий кліп на Twitch.</p>
                    <a
                      href={previewClip.clipUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--vc-accent)] hover:text-[var(--vc-accent)] underline font-medium"
                    >
                      Відкрити на Twitch
                    </a>
                  </div>
                );
              })()}
            </div>
            <div className="px-4 py-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-sm shrink-0">
              <p className="text-[var(--vc-muted)]">
                Стример:{" "}
                <span className="text-[#c9c9c5]">{previewClip.author}</span>
              </p>
              <a
                href={previewClip.clipUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--vc-accent)] hover:text-[var(--vc-accent)] font-medium"
              >
                Відкрити на Twitch ↗
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {clips.length > 0 ? (
        <>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--vc-muted)]">
              Кандидати
            </h4>
            <ul className="m-0 mx-auto grid max-w-5xl list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2">
              {clips.map((c) => {
                const picked = isPicked(c.clipUrl);
                const order = pickOrder(c.clipUrl);
                return (
                  <li key={c.voteKey}>
                    <div
                      className={
                        "flex h-full flex-col overflow-hidden border transition-all duration-200 " +
                        (picked
                          ? "border-[var(--vc-line)] bg-[#151515] "
                          : "border-white/[0.08] bg-gray-950/40 hover:border-[var(--vc-line)]")
                      }
                    >
                      <div className="relative">
                        {order != null ? (
                          <span
                            className="absolute left-2 top-2 z-20 flex h-8 min-w-[2rem] items-center justify-center bg-[var(--vc-accent)] px-2 text-sm font-black text-[var(--vc-bg)] border border-[var(--vc-line)]"
                            aria-label={`Місце в топі: ${order}`}
                          >
                            {order}
                          </span>
                        ) : null}
                        <ClipCard
                          embedMode
                          onOpenEmbed={() => setPreviewClip(c)}
                          clip={{
                            url: c.clipUrl,
                            clipUrl: c.clipUrl,
                            title: c.title,
                            author: c.author,
                            thumbProxy: c.thumbProxy,
                          }}
                        />
                      </div>
                      <div className="mt-auto border-t border-white/[0.06] p-3">
                        <button
                          type="button"
                          disabled={
                            !user ||
                            hasVoted ||
                            (!canAddMore && !picked)
                          }
                          onClick={() => togglePick(c.clipUrl)}
                          className={
                            "w-full py-3 px-3 text-sm font-bold transition-all " +
                            (picked
                              ? "bg-gray-800/90 text-[var(--vc-accent)] border border-[var(--vc-line)] hover:bg-gray-700"
                              : "bg-[var(--vc-accent)] text-[var(--vc-bg)] hover:brightness-110 text-white hover:from-amber-400 hover:to-orange-500 " +
                                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-orange-600")
                          }
                        >
                          {hasVoted
                            ? "Вибір зроблено"
                            : picked
                              ? "У топі — прибрати"
                              : canAddMore
                                ? "Обрати"
                                : `Ліміт ${picksRequired} — зніми один`}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div
            className={
              "fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl border-t border-[var(--vc-line)] bg-gray-950/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-lg " +
              "md:relative md:inset-auto md:z-0 md:mt-8 md:border md: md:border-[var(--vc-line)] md:-none"
            }
          >
            <div className="flex flex-col gap-3 sm:items-center">
              {!hasVoted ? (
                <p className="text-center text-sm text-[var(--vc-muted)]">
                  {selectedClipUrls.length === picksRequired ? (
                    <span className="text-[var(--vc-accent)]">
                      Усі місця заповнені — підтвердь голос
                    </span>
                  ) : (
                    <>
                      Обрано{" "}
                      <span className="font-semibold tabular-nums text-[var(--vc-accent)]">
                        {selectedClipUrls.length}
                      </span>{" "}
                      з {picksRequired}
                    </>
                  )}
                </p>
              ) : null}
              <button
                type="button"
                disabled={
                  !user ||
                  hasVoted ||
                  selectedClipUrls.length !== picksRequired ||
                  submitting
                }
                onClick={() => void confirmVotes()}
                className={
                  "w-full py-4 px-6 text-base font-bold text-white sm:max-w-md " +
                  "bg-[var(--vc-accent)] text-[var(--vc-bg)] hover:brightness-110 " +
                  " transition-all " +
                  "hover:from-emerald-500 hover:to-teal-500 hover: " +
                  "active:scale-[0.99] " +
                  "disabled:cursor-not-allowed disabled:opacity-40 disabled:-none " +
                  "disabled:from-gray-700 disabled:to-gray-700"
                }
              >
                {hasVoted
                  ? "Голос уже надіслано"
                  : submitting
                    ? "Збереження…"
                    : "Підтвердити голос"}
              </button>
              {hasVoted ? (
                <p className="text-center text-sm text-[var(--vc-accent)] px-1 leading-relaxed">
                  Ти вже проголосував у цьому турі. Повторно голос надіслати неможливо.
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-[var(--vc-muted)] text-sm">
          Поки немає кліпів у таблиці — додай їх через форму «Додати кліп».
        </p>
      )}
    </div>
  );
}
