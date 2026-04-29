import { useEffect, useState } from "react";
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

export default function ClipsGrid({
  items = [],
  page = 1,
  totalPages = 1,
  maxPages = 10,
  cappedArchive = false,
  clipsPerPage = 9,
  totalItems = 0,
  onPageChange,
}) {
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
  const pageButtons = showPager
    ? visiblePageNumbers(page, totalPages, 5)
    : [];

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

  return (
    <section
      className="relative py-16 bg-[#0a0014] overflow-hidden"
      id="latest-clips"
    >
      {previewClip ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm"
          role="presentation"
          onClick={() => setPreviewClip(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-clip-embed-dialog-title"
            className="relative w-full max-w-4xl rounded-2xl bg-[#0e0e10] ring-2 ring-violet-500/35 shadow-2xl overflow-hidden flex flex-col max-h-[min(92vh,900px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/[0.08] shrink-0">
              <h3
                id="home-clip-embed-dialog-title"
                className="text-base sm:text-lg font-bold text-white pr-2 line-clamp-2"
              >
                {previewClip.title || "Кліп"}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewClip(null)}
                className="shrink-0 rounded-xl px-3 py-1.5 text-2xl leading-none text-gray-300 hover:bg-white/10 hover:text-white"
                aria-label="Закрити перегляд"
              >
                ×
              </button>
            </div>
            <div className="relative w-full aspect-video bg-black shrink-0">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-gray-400 text-sm">
                    <p>Не вдалося вбудувати це посилання. Відкрий кліп на Twitch.</p>
                    <a
                      href={previewClip.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-400 hover:text-violet-300 underline font-medium"
                    >
                      Відкрити на Twitch
                    </a>
                  </div>
                );
              })()}
            </div>
            <div className="px-4 py-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-sm shrink-0">
              <p className="text-gray-500">
                Стрімер: <span className="text-gray-300">{previewClip.author}</span>
              </p>
              <a
                href={previewClip.url}
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:text-violet-300 font-medium"
              >
                Відкрити на Twitch ↗
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/35 to-transparent"
        aria-hidden
      />
      <div className="max-w-6xl mx-auto px-4 relative">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight">
          Останні додані кліпи
        </h2>
        <p className="text-gray-300 text-center mt-2 max-w-xl mx-auto text-[15px] leading-relaxed">
          Свіжі моменти з українського Twitch, які додали саме ви.
          {totalItems > 0 ? (
            <span className="block mt-1 text-sm text-gray-500 space-y-0.5">
              <span className="block">
                Усього в добірці:{" "}
                <span className="text-gray-400 tabular-nums">
                  {totalItems.toLocaleString("uk-UA")}
                </span>
                {showPager ? (
                  <>
                    {" "}
                    · сторінка {page} з {totalPages}
                  </>
                ) : null}
              </span> 
            </span>
          ) : null}
        </p>

        {isEmpty ? (
          <div className="text-center text-gray-400 mt-10">
            Поки що немає кліпів. Додай перший —{" "}
            <a href="/submit" className="text-purple-400 underline">
              надіслати
            </a>
            .
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 mt-10">
              {normalized.map((clip) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  embedMode
                  onOpenEmbed={() => setPreviewClip(clip)}
                />
              ))}
            </div>

            {showPager ? (
              <nav
                className="flex flex-wrap items-center justify-center gap-2 mt-12"
                aria-label="Сторінки кліпів"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className="min-h-[44px] px-4 rounded-xl text-sm font-medium text-white bg-white/5 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none transition"
                >
                  Назад
                </button>
                {pageButtons.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={
                      "min-w-[44px] min-h-[44px] rounded-xl text-sm font-semibold transition " +
                      (p === page
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/40"
                        : "text-gray-300 bg-white/5 ring-1 ring-white/10 hover:bg-white/10")
                    }
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="min-h-[44px] px-4 rounded-xl text-sm font-medium text-white bg-white/5 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none transition"
                >
                  Далі
                </button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
