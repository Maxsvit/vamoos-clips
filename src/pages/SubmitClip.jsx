import { useState, useMemo } from "react";
import { apiUrl } from "../lib/apiOrigin";
import Footer from "../components/Footer";

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
      setError("✕ ПЕРЕВІР ПОЛЯ ТА ПІДТВЕРДИ ПРАВИЛА.");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/submit"), {
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
        setMessage("● КЛІП НАДІСЛАНО. ДЯКУЄМО!");
        setClipUrl("");
        setTitle("");
        setAuthor("");
        setNote("");
        setAgree(false);
      } else {
        setError("✕ ПОМИЛКА ПРИ ВІДПРАВЦІ. СПРОБУЙ ЩЕ РАЗ.");
      }
    } catch {
      setError("✕ НЕ ВДАЛОСЯ НАДІСЛАТИ. ПЕРЕВІР З’ЄДНАННЯ.");
    }
  };

  const field =
    "vc-mono w-full min-h-[52px] border bg-transparent px-4 text-sm text-[var(--vc-fg)] outline-none transition placeholder:text-[var(--vc-dim)] focus:border-[var(--vc-accent)]";
  const label = "vc-mono mb-2 block text-xs text-[var(--vc-muted)]";

  return (
    <div className="vc-root">
      <section className="border-b border-[var(--vc-line)]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
          <h1 className="vc-display m-0 text-[clamp(36px,6.4vw,92px)] font-black uppercase leading-[1.12] tracking-[-0.045em]">
            Додати <span className="text-[var(--vc-accent)]">кліп</span>
          </h1>
          <p className="m-0 max-w-[560px] text-lg leading-relaxed text-[#c9c9c5]">
            Дотримайся правил, і твій кліп матиме шанс потрапити в наступну добірку на YouTube.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1320px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <aside className="flex flex-col gap-8">
          <h2 className="vc-display m-0 text-2xl font-black uppercase tracking-[-0.02em]">Умови відбору</h2>
          <div className="flex flex-col">
            <span className="vc-mono border-b border-[var(--vc-line)] pb-3 text-xs text-[var(--vc-accent)]">✓ ДОЗВОЛЕНО</span>
            <ul className="m-0 list-none p-0">
              <li className="border-b border-[var(--vc-line)] py-3 text-[15px]">Україномовний контент (стрім і чат українською).</li>
              <li className="border-b border-[var(--vc-line)] py-3 text-[15px]">
                Свіжі кліпи: зроблені протягом останніх <b>36 годин</b>.
              </li>
            </ul>
          </div>
          <div className="flex flex-col">
            <span className="vc-mono border-b border-[var(--vc-line)] pb-3 text-xs text-[#ff8a7a]">✕ НЕ ПРИЙМАЄМО</span>
            <ul className="m-0 list-none p-0">
              <li className="border-b border-[var(--vc-line)] py-3 text-[15px]">Російськомовний контент.</li>
              <li className="border-b border-[var(--vc-line)] py-3 text-[15px]">
                Толерування російської мови на стрімах, колаби з російськими стрімерами.
              </li>
              <li className="border-b border-[var(--vc-line)] py-3 text-[15px]">Публічну підтримку російської аудиторії чи контенту.</li>
              <li className="border-b border-[var(--vc-line)] py-3 text-[15px]">Моменти з казино, азартними іграми та їхньою рекламою.</li>
            </ul>
          </div>
          <p className="m-0 text-xs text-[var(--vc-muted)]">
            Надсилаючи кліп, ти підтверджуєш згоду з правилами. Порушення може призвести до відхилення майбутніх
            заявок.
          </p>
        </aside>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 border border-[var(--vc-line)] p-5 sm:p-8">
          <div>
            <label htmlFor="clip-url" className={label}>
              ПОСИЛАННЯ НА КЛІП *
            </label>
            <input
              id="clip-url"
              type="url"
              placeholder="https://www.twitch.tv/<канал>/clip/… або https://clips.twitch.tv/…"
              value={clipUrl}
              onChange={(e) => setClipUrl(e.target.value)}
              className={`${field} ${
                clipUrl.length === 0 ? "border-[var(--vc-line)]" : isTwitchClip ? "border-[var(--vc-accent)]" : "border-[#ff8a7a]"
              }`}
              required
            />
            {clipUrl && !isTwitchClip && (
              <p className="vc-mono mt-2 text-xs text-[#ff8a7a]">✕ ВКАЖИ КОРЕКТНЕ ПОСИЛАННЯ НА TWITCH-КЛІП</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="clip-title" className={label}>
                НАЗВА КЛІПУ *
              </label>
              <input
                id="clip-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${field} border-[var(--vc-line)]`}
                required
              />
            </div>
            <div>
              <label htmlFor="clip-author" className={label}>
                СТРІМЕР *
              </label>
              <input
                id="clip-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className={`${field} border-[var(--vc-line)]`}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="clip-note" className={label}>
              ТВІЙ НІК / КОМЕНТАР
            </label>
            <input
              id="clip-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${field} border-[var(--vc-line)]`}
              placeholder="необов'язково"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-[#c9c9c5]">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--vc-accent)]"
            />
            <span>Підтверджую, що мій кліп відповідає правилам і може бути використаний у нарізках.</span>
          </label>

          {error && (
            <p className="vc-mono m-0 text-[13px] text-[#ff8a7a]" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="vc-mono m-0 text-[13px] text-[var(--vc-accent)]" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="vc-display min-h-[56px] w-full cursor-pointer bg-[var(--vc-accent)] px-8 text-[15px] font-bold uppercase text-[var(--vc-bg)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-fit"
          >
            Відправити →
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
