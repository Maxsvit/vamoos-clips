import ClipCard from "./ClipCard";

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

  return (
    <section
      className="relative py-16 bg-[#0a0014] overflow-hidden"
      id="latest-clips"
    >
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
                <ClipCard key={clip.id} clip={clip} />
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
