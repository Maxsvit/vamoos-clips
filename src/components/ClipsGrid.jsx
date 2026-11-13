import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ClipCard, { getClipSlug } from "./ClipCard";

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

function visiblePageNumbers(current, total, maxVisible = 5) {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const half = Math.floor(maxVisible / 2);
  let start = current - half;
  let end = start + maxVisible - 1;
  if (start < 1) {
    start = 1;
    end = maxVisible;
  }
  if (end > total) {
    end = total;
    start = total - maxVisible + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const pad2 = (n) => String(n).padStart(2, "0");

export default function ClipsGrid({ items = [], page = 1, totalPages = 1, totalItems = 0, pageSize = 9, onPageChange }) {
  const [previewClip, setPreviewClip] = useState(null);
  const isEmpty = !items || items.length === 0;

  const normalized = (items || [])
    .map((c, idx) => ({
      id: c.id ?? `clip-${idx}`,
      url: (c.url ?? c.clipUrl ?? "").toString().trim(),
      thumbProxy: c.thumbProxy ?? null,
      title: c.title ?? "Без назви",
      author: c.author ?? "Невідомо",
      note: c.note ?? "",
    }))
    .filter((x) => !!x.url && /^https?:\/\//i.test(x.url));

  const showPager = totalPages > 1 && typeof onPageChange === "function";
  const pageButtons = showPager ? visiblePageNumbers(page, totalPages, 5) : [];

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

  const pagerBtn =
    "vc-mono min-h-[48px] min-w-[48px] cursor-pointer border-r border-[var(--vc-line)] px-4 text-[13px] disabled:pointer-events-none disabled:opacity-30";

  return (
    <section className="mx-auto max-w-[1320px] scroll-mt-20 px-4 pb-20 pt-16 sm:px-6 sm:pt-20" id="latest-clips">
      {previewClip ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="presentation"
          onClick={() => setPreviewClip(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-clip-embed-dialog-title"
            className="relative flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden border border-[var(--vc-line)] bg-[var(--vc-bg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--vc-line)] px-4 py-3">
              <h3 id="home-clip-embed-dialog-title" className="vc-display m-0 line-clamp-2 pr-2 text-base font-bold uppercase sm:text-lg">
                {previewClip.title || "Кліп"}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewClip(null)}
                className="vc-mono min-h-[44px] shrink-0 cursor-pointer border border-[var(--vc-line)] px-3 text-[13px] text-[var(--vc-fg)] hover:border-[var(--vc-fg)]"
                aria-label="Закрити перегляд"
              >
                ЗАКРИТИ ✕
              </button>
            </div>
            <div className="relative aspect-video w-full shrink-0 bg-black">
              {(() => {
                const slug = getClipSlug(previewClip.url);
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-sm text-[var(--vc-muted)]">
                    <p>Не вдалося вбудувати це посилання. Відкрий кліп на Twitch.</p>
                    <a href={previewClip.url} target="_blank" rel="noreferrer" className="vc-mono">
                      ВІДКРИТИ НА TWITCH ↗
                    </a>
                  </div>
                );
              })()}
            </div>
            <div className="vc-mono flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--vc-line)] px-4 py-3 text-[13px]">
              <span className="text-[var(--vc-muted)]">
                СТРІМЕР: <span className="text-[var(--vc-fg)]">{previewClip.author}</span>
              </span>
              <a href={previewClip.url} target="_blank" rel="noreferrer">
                ВІДКРИТИ НА TWITCH ↗
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <h2 className="vc-display m-0 text-[clamp(28px,3.4vw,48px)] font-black uppercase leading-[1.12] tracking-[-0.03em]">
          Останні кліпи
        </h2>
        {totalItems > 0 && (
          <span className="vc-mono text-[13px] text-[var(--vc-muted)]">
            [ {totalItems.toLocaleString("uk-UA")} У ДОБІРЦІ{showPager ? ` · СТОРІНКА ${pad2(page)} / ${pad2(totalPages)}` : ""} ]
          </span>
        )}
      </div>

      {isEmpty ? (
        <p className="m-0 border-t border-[var(--vc-line)] py-12 text-[var(--vc-muted)]">
          Поки що немає кліпів. Додай перший:{" "}
          <Link to="/submit" className="vc-mono">
            НАДІСЛАТИ КЛІП →
          </Link>
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 border-l border-t border-[var(--vc-line)] sm:grid-cols-2 lg:grid-cols-3">
            {normalized.map((clip, i) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                index={(page - 1) * pageSize + i + 1}
                cell
                embedMode
                onOpenEmbed={() => setPreviewClip(clip)}
              />
            ))}
          </div>

          {showPager ? (
            <nav className="mt-10 flex w-fit max-w-full flex-wrap border-l border-y border-[var(--vc-line)]" aria-label="Сторінки кліпів">
              <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={`${pagerBtn} text-[var(--vc-fg)] hover:bg-[#151515]`}>
                ← НАЗАД
              </button>
              {pageButtons.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`${pagerBtn} ${
                    p === page ? "bg-[var(--vc-accent)] font-bold text-[var(--vc-bg)]" : "text-[var(--vc-muted)] hover:bg-[#151515] hover:text-[var(--vc-fg)]"
                  }`}
                >
                  {pad2(p)}
                </button>
              ))}
              <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className={`${pagerBtn} text-[var(--vc-fg)] hover:bg-[#151515]`}>
                ДАЛІ →
              </button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
