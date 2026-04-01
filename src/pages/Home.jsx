import { useEffect, useRef, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import ClipsGrid from "../components/ClipsGrid";
import Footer from "../components/Footer";
import YouTubeSection from "../components/YouTubeSection";
import { apiUrl } from "../lib/apiOrigin";

const CLIPS_PAGE_SIZE = 9;
const MAX_CLIP_PAGES = 10;
const CLIP_COUNT_POLL_MS = 30_000;

function clipWordUk(n) {
  const k = n % 10;
  const k100 = n % 100;
  if (k === 1 && k100 !== 11) return "кліп";
  if (k >= 2 && k <= 4 && (k100 < 12 || k100 > 14)) return "кліпи";
  return "кліпів";
}

function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Math.max(
    1,
    parseInt(searchParams.get("clipsPage") || "1", 10) || 1
  );

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const countAnimRef = useRef(0);
  const countDisplayRef = useRef(0);

  const linkBtnHome =
    "px-5 py-2 rounded-2xl text-[15px] md:text-xl font-bold  text-white " +
    "bg-gradient-to-br from-violet-500 to-fuchsia-500 " +
    "hover:from-violet-400 hover:to-fuchsia-400 " +
    "border border-white/10 shadow-[0_4px_20px_rgba(139,92,246,.25)] " +
    "transition-all duration-200 hover:shadow-[0_6px_26px_rgba(139,92,246,.35)] hover:translate-y-[-1px]";

  useEffect(() => {
    let cancelled = false;
    const pageToFetch = Math.min(rawPage, MAX_CLIP_PAGES);

    (async () => {
      setLoading(true);
      try {
        const r = await fetch(
          apiUrl(`/api/clips?page=${pageToFetch}&limit=${CLIPS_PAGE_SIZE}`)
        );
        const data = await r.json();

        const raw = data?.items ?? data?.clips ?? [];
        const totalCount =
          typeof data?.total === "number" ? data.total : raw.length;

        const norm = (raw || [])
          .map((c, i) => {
            const url = (c.url ?? c.clipUrl ?? "").toString().trim();
            return {
              id: c.id ?? `gs-${i}`,
              url,
              clipUrl: c.clipUrl,
              thumbProxy: c.thumbProxy ?? null,
              title: c.title || "Без назви",
              author: c.author || "Невідомо",
              note: c.note || "",
            };
          })
          .filter((x) => !!x.url && /^https?:\/\//i.test(x.url));

        const seen = new Set();
        const unique = [];
        for (const it of norm) {
          if (seen.has(it.url)) continue;
          seen.add(it.url);
          unique.push(it);
        }

        if (!cancelled) {
          setItems(unique);
          setTotal(totalCount);

          const fullPages = Math.max(1, Math.ceil(totalCount / CLIPS_PAGE_SIZE));
          const cappedPages = Math.min(fullPages, MAX_CLIP_PAGES);
          if (rawPage > cappedPages) {
            setSearchParams((prev) => {
              const q = new URLSearchParams(prev);
              if (cappedPages <= 1) q.delete("clipsPage");
              else q.set("clipsPage", String(cappedPages));
              return q;
            });
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawPage, setSearchParams]);

  const fullTotalPages = Math.max(1, Math.ceil(total / CLIPS_PAGE_SIZE));
  const totalPages = Math.min(fullTotalPages, MAX_CLIP_PAGES);
  const page = Math.min(rawPage, totalPages);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(apiUrl(`/api/clips?page=1&limit=1`));
        const data = await r.json();
        const n =
          typeof data?.total === "number"
            ? data.total
            : (data?.clips ?? []).length;
        if (!cancelled && typeof n === "number") setTotal(n);
      } catch {
        /* ignore poll errors */
      }
    };
    tick();
    const id = setInterval(tick, CLIP_COUNT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (total <= 0) {
      countDisplayRef.current = 0;
      setAnimatedTotal(0);
      return;
    }

    const from = countDisplayRef.current;
    const to = total;
    if (from === to) return;

    const diff = Math.abs(to - from);
    const duration =
      diff <= 2 ? 160 : Math.min(1300, 260 + diff * 0.48);

    let raf = 0;
    const t0 = performance.now();

    const easeOut = (t) => 1 - (1 - t) ** 3;

    const step = (now) => {
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / duration);
      const v = Math.round(from + (to - from) * easeOut(t));
      if (v !== countDisplayRef.current) {
        countDisplayRef.current = v;
        setAnimatedTotal(v);
      }
      if (t < 1) {
        raf = requestAnimationFrame(step);
        countAnimRef.current = raf;
      } else {
        countDisplayRef.current = to;
        setAnimatedTotal(to);
      }
    };

    cancelAnimationFrame(countAnimRef.current);
    raf = requestAnimationFrame(step);
    countAnimRef.current = raf;

    return () => {
      cancelAnimationFrame(countAnimRef.current);
    };
  }, [total]);

  const goToPage = (next) => {
    const p = Math.min(Math.max(1, next), totalPages);
    setSearchParams((prev) => {
      const q = new URLSearchParams(prev);
      if (p <= 1) q.delete("clipsPage");
      else q.set("clipsPage", String(p));
      return q;
    });
    const el = document.getElementById("latest-clips");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-[#0a0014] pt-32">
      <div className="hero-backdrop">
        <div className="hero-aurora" aria-hidden>
          <span className="hero-aurora__blob hero-aurora__blob--a" />
          <span className="hero-aurora__blob hero-aurora__blob--b" />
          <span className="hero-aurora__blob hero-aurora__blob--c" />
        </div>
        <div className="hero-backdrop__vignette" aria-hidden />
        <div className="hero-backdrop__content text-white text-center max-w-3xl mx-auto font-['Montserrat'] pt-24 px-2">
        <h1 className="hero-title-anim text-3xl md:text-5xl xl:text-6xl font-bold mb-5">
          Найкращі Twitch кліпи <br /> українських стрімерів
        </h1>
       
        <h2 className="text-[#d1d5db] text-lg md:text-xl pb-8">
          Дивись свіжі добірки з українського Twitch та надсилай свої кліпи,{" "}
          <br /> щоб потрапити у наступний випуск.
        </h2>
        <div
          className="hero-stat-chassis mb-10 mx-auto max-w-[min(100%,320px)]"
          aria-live="polite"
        >
          <div className="hero-stat-chassis__shell">
            <span className="hero-stat-chassis__spin" aria-hidden />
            <div className="hero-stat-chassis__inner">
              <div
                className={
                  "hero-stat-anim relative z-[1] rounded-[1.75rem] border border-white/[0.06] " +
                  "bg-gradient-to-b from-white/[0.08] via-white/[0.025] to-transparent px-3 py-5 " +
                  "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                }
              >
                <p className="text-center text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-400/75">
                  Надіслано вами за весь час
                </p>
                <div className="mt-1 h-px w-12 mx-auto rounded-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                <p className="mt-4 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0">
                  <span
                    className={
                      "tabular-nums text-[2.15rem] sm:text-4xl md:text-[2.75rem] font-extrabold leading-none tracking-tight " +
                      (loading && total === 0
                        ? "text-gray-600"
                        : "bg-gradient-to-br from-white via-white to-violet-200/90 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(167,139,250,0.35)]")
                    }
                  >
                    {loading && total === 0
                      ? "…"
                      : animatedTotal.toLocaleString("uk-UA")}
                  </span>
                  <span className="text-[1.05rem] sm:text-lg font-medium text-violet-200/55 pb-px">
                    {animatedTotal > 0 || total > 0
                      ? clipWordUk(animatedTotal > 0 ? animatedTotal : total)
                      : "кліпів"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="flex justify-center pb-8">
        <NavLink to="/submit" className={linkBtnHome}>
          Додати кліп 🚀
        </NavLink>
      </div>

      {loading ? (
        <section className="py-16 text-center text-gray-400">
          Завантажуємо кліпи…
        </section>
      ) : (
        <ClipsGrid
          items={items}
          page={page}
          totalPages={totalPages}
          maxPages={MAX_CLIP_PAGES}
          cappedArchive={fullTotalPages > MAX_CLIP_PAGES}
          clipsPerPage={CLIPS_PAGE_SIZE}
          totalItems={total}
          onPageChange={goToPage}
        />
      )}

      <YouTubeSection />
      <Footer />
    </div>
  );
}

export default Home;
