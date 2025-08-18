import ClipCard from "./ClipCard";

export default function ClipsGrid({ items = [] }) {
  const isEmpty = !items || items.length === 0;

  const normalized = (items || [])
    .map((c, idx) => ({
      id: c.id ?? `clip-${idx}`,
      url: (c.url ?? c.clipUrl ?? "").toString().trim(),
      title: c.title ?? "Без назви",
      author: c.author ?? "Невідомо",
      note: c.note ?? "",
    }))
    .filter((x) => !!x.url && /^https?:\/\//i.test(x.url));

  return (
    <section className="py-16 bg-[#0a0014]" id="latest-clips">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center">
          🎥 Останні додані кліпи
        </h2>
        <p className="text-gray-300 text-center mt-2">
          Свіжі моменти з українського Twitch, які додали саме ви.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {normalized.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
