import { useEffect, useRef, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import ClipsGrid from "../components/ClipsGrid";
import Footer from "../components/Footer";
import YouTubeSection from "../components/YouTubeSection";
import { apiUrl } from "../lib/apiOrigin";
import { VIEWERS_CHOICE_ENABLED } from "../lib/features";
import { useVcVisible } from "../lib/vcStatus";
import { useAuth } from "../context/AuthContext";

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
  const { user } = useAuth();
  const vc = useVcVisible(user?.id ? String(user.id) : "");
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
    <div className="vc-root">
      {VIEWERS_CHOICE_ENABLED && vc.visible && (
        <NavLink
          to="/viewers-choice"
          className="vc-display flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-[var(--vc-accent)] px-4 py-3 text-center text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--vc-bg)] no-underline hover:brightness-110"
        >
          <span>Народний Viewers Choice ’26</span>
          <span className="vc-mono font-bold">ГОЛОСУЙ ЗА СВОЇХ СТРІМЕРІВ →</span>
        </NavLink>
      )}

      <section className="border-b border-[var(--vc-line)]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-10 px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
          <h1 className="vc-display m-0 text-[clamp(28px,6.4vw,92px)] font-black uppercase leading-[1.12] tracking-[-0.045em]">
            Найкращі <span className="text-[var(--vc-accent)]">кліпи</span>
            <br />
            українського
            <br />
            Twitch
          </h1>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <p className="m-0 max-w-[480px] text-lg leading-relaxed text-[#c9c9c5]">
              Дивись свіжі добірки з українського Twitch і надсилай свої кліпи, щоб потрапити в наступний
              випуск.
            </p>
            <div className="flex flex-wrap border border-[var(--vc-line)]" aria-live="polite">
              <div className="flex flex-col justify-center border-r border-[var(--vc-line)] px-6 py-3.5">
                <span className="vc-display text-[40px] font-black leading-none tracking-[-0.03em] tabular-nums">
                  {loading && total === 0 ? "…" : animatedTotal.toLocaleString("uk-UA")}
                </span>
                <span className="vc-mono mt-1.5 text-[11px] text-[var(--vc-muted)]">
                  {(animatedTotal > 0 || total > 0
                    ? clipWordUk(animatedTotal > 0 ? animatedTotal : total)
                    : "кліпів"
                  ).toUpperCase()}{" "}
                  НАДІСЛАНО ВАМИ
                </span>
              </div>
              <NavLink
                to="/submit"
                className="vc-display flex min-h-[80px] items-center bg-[var(--vc-accent)] px-7 text-[15px] font-bold uppercase text-[var(--vc-bg)] no-underline"
              >
                Додати кліп →
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="vc-mono mx-auto max-w-[1320px] px-4 py-20 text-sm text-[var(--vc-muted)] sm:px-6">
          ЗАВАНТАЖУЄМО КЛІПИ…
        </section>
      ) : (
        <ClipsGrid
          items={items}
          page={page}
          totalPages={totalPages}
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
