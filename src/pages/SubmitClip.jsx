import { useState, useMemo } from "react";

export default function SubmitClip() {
  const [clipUrl, setClipUrl] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  const isTwitchClip = useMemo(() => {
    const u = clipUrl.trim();
    if (
      !/^https?:\/\/(www\.)?twitch\.tv\//i.test(u) &&
      !/^https?:\/\/clips\.twitch\.tv\//i.test(u)
    )
      return false;
    return (
      /\/clip\/[\w-]+/i.test(u) ||
      /^https?:\/\/clips\.twitch\.tv\/[\w-]+/i.test(u)
    );
  }, [clipUrl]);

  const canSubmit = agree && isTwitchClip && !!title && !!author;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!canSubmit) {
      setError("Перевір поля та підтверди правила.");
      return;
    }

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipUrl: clipUrl.trim(),
          title: title.trim(),
          author: author.trim(),
          note: note.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("✅ Кліп успішно відправлений! Дякуємо 💜");
        setClipUrl("");
        setTitle("");
        setAuthor("");
        setNote("");
        setAgree(false);
      } else {
        setError("❌ Помилка при відправці. Спробуйте ще раз.");
      }
    } catch {
      setError("❌ Не вдалося надіслати форму. Перевірте з’єднання.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <section className="rounded-2xl bg-[#16121f] ring-1 ring-white/10 shadow-xl overflow-hidden my-10">
        <div className="bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 px-6 py-4">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            📜 Умови відбору кліпів
          </h2>
          <p className="text-sm text-gray-300 mt-1">
            Дотримайся правил нижче — і твій кліп матиме шанс потрапити в
            добірку.
          </p>
        </div>

        <div className="px-6 py-5 text-gray-200 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-green-400">🟢 Дозволено</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Україномовний контент (стрім і чат українською).</li>
              <li>
                Свіжі кліпи — зроблені протягом останніх <b>36 годин</b>.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-red-400">🔴 Не приймаємо</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Російськомовний контент.</li>
              <li>Толерування російської мови на стрімах/колаби з російськими стрімерами</li>
              <li>Публічна підтримка російської аудиторії/контенту.</li>
              <li>Моменти з казино та азартними іграми/рекламою.</li>
            </ul>
          </div>

          <p className="md:col-span-2 text-xs text-gray-400 border-t border-white/10 pt-4">
            Надсилаючи кліп, ти підтверджуєш згоду з правилами. Порушення може
            призвести до відхилення майбутніх заявок.
          </p>
        </div>
      </section>

      <div className="mt-8 text-white bg-[#1a1625] rounded-2xl ring-1 ring-white/10 shadow-xl">
        <h1 className="text-2xl font-bold px-6 pt-6">Додати кліп 🚀</h1>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Clip URL *
            </label>
            <input
              type="url"
              placeholder="https://www.twitch.tv/<channel>/clip/ або https://clips.twitch.tv/"
              value={clipUrl}
              onChange={(e) => setClipUrl(e.target.value)}
              className={`w-full p-3 rounded-lg bg-[#121016] ring-1 outline-none transition
                ${
                  clipUrl.length === 0
                    ? "ring-white/10"
                    : isTwitchClip
                    ? "ring-emerald-500/50"
                    : "ring-red-500/50"
                }`}
              required
            />
            {clipUrl && !isTwitchClip && (
              <p className="text-xs text-red-400 mt-1">
                Вкажи кректний лінк на твіч-кліп.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Назва кліпу *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#121016] ring-1 ring-white/10 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Стрімер *
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#121016] ring-1 ring-white/10 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Ваш нік / коментар
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#121016] ring-1 ring-white/10 outline-none"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
            />
            <span>
              Підтверджую, що мій кліп відповідає правилам і може бути
              використаний у нарізках.
            </span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 font-semibold shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            Відправити
          </button>
        </form>
      </div>
    </div>
  );
}
