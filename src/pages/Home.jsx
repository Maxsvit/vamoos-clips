import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import ClipsGrid from "../components/ClipsGrid";
import Footer from "../components/Footer";
import YouTubeSection from "../components/YouTubeSection";

function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const linkBtnHome =
    "px-5 py-2 rounded-2xl text-[15px] md:text-xl font-bold  text-white " +
    "bg-gradient-to-br from-violet-500 to-fuchsia-500 " +
    "hover:from-violet-400 hover:to-fuchsia-400 " +
    "border border-white/10 shadow-[0_4px_20px_rgba(139,92,246,.25)] " +
    "transition-all duration-200 hover:shadow-[0_6px_26px_rgba(139,92,246,.35)] hover:translate-y-[-1px]";

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("http://localhost:8080/api/clips");
        const data = await r.json();

        const raw = data?.items ?? data?.clips ?? [];

        const norm = (raw || [])
          .map((c, i) => {
            const url = (c.url ?? c.clipUrl ?? "").toString().trim();
            return {
              id: c.id ?? `gs-${i}`,
              url,
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

        setItems(unique);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-[#0a0014] pt-32">
      <div className="text-white text-center max-w-3xl mx-auto font-['Montserrat'] pt-24 ">
        <h1 className="text-3xl md:text-5xl xl:text-6xl font-bold mb-4">
          Найкращі Twitch кліпи <br /> українських стрімерів
        </h1>
        <h2 className="text-[#d1d5db] text-lg md:text-xl  pb-8">
          Дивись свіжі добірки з українського Twitch та надсилай свої кліпи,{" "}
          <br /> щоб потрапити у наступний випуск.
        </h2>
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
        <ClipsGrid items={items} />
      )}

      <YouTubeSection />
      <Footer />
    </div>
  );
}

export default Home;
