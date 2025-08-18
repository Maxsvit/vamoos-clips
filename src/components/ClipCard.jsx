import { useEffect, useState } from "react";
import fallbackLogo from "../assets/img/logo.jpg";

function getClipSlug(twitchUrl) {
  try {
    const u = new URL(twitchUrl);
    if (u.hostname.includes("clips.twitch.tv")) return u.pathname.slice(1);
    const p = u.pathname.split("/").filter(Boolean);
    const i = p.findIndex((x) => x.toLowerCase() === "clip");
    if (i >= 0 && p[i + 1]) return p[i + 1];
  } catch {
    console.warn("Invalid URL:", twitchUrl);
  }
  return null;
}

function isHttp(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ClipCard({ clip }) {
  const realUrl = (clip?.url ?? clip?.clipUrl ?? "").toString().trim();
  const [thumb, setThumb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!realUrl || !isHttp(realUrl)) {
      setFailed(true);
      setThumb(fallbackLogo); // одразу лого якщо URL кривий
      setLoading(false);
      return;
    }

    let abort = false;

    (async () => {
      setLoading(true);
      setFailed(false);
      console.debug("[ClipCard] start:", realUrl);

      // 0) миттєвий fallback по slug (щоб не було пустої картки)
      const slug = getClipSlug(realUrl);
      if (slug && !abort) {
        setThumb(
          `http://localhost:8080/api/clip-thumb?slug=${encodeURIComponent(
            slug
          )}`
        );
      } else {
        setThumb(fallbackLogo);
      }

      try {
        // 1) пробуємо кращий thumb через бек
        const res = await fetch(
          `http://localhost:8080/api/clip-preview?url=${encodeURIComponent(
            realUrl
          )}`
        );

        if (res.ok) {
          const data = await res.json();
          console.debug("[clip-preview]", data);

          if (data.thumbnail_url) {
            const viaProxy = `http://localhost:8080/api/img?url=${encodeURIComponent(
              data.thumbnail_url
            )}`;
            if (!abort) setThumb(viaProxy);
          } else {
            // якщо прев'ю немає → fallback
            if (!abort) setThumb(fallbackLogo);
          }
        } else {
          console.warn("[clip-preview] HTTP", res.status, realUrl);
          if (!abort) setThumb(fallbackLogo);
        }
      } catch (e) {
        console.warn("[clip-preview] error", e);
        if (!abort) setThumb(fallbackLogo);
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [realUrl]);

  return (
    <a
      href={realUrl}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-xl overflow-hidden bg-[#121016] ring-1 ring-white/5 shadow-lg hover:ring-purple-500/50 transition transform hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden">
        {loading && (
          <div className="absolute inset-0 animate-pulse bg-white/5" />
        )}

        {thumb && !failed && (
          <img
            src={thumb}
            alt={clip.title}
            className="w-full h-full object-cover transition group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={() => {
              if (thumb.includes("/api/img")) {
                const slug = getClipSlug(realUrl);
                if (slug) {
                  setThumb(
                    `http://localhost:8080/api/clip-thumb?slug=${encodeURIComponent(
                      slug
                    )}`
                  );
                  return;
                }
              }
              setFailed(true);
            }}
          />
        )}

        {failed && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-gray-300 text-sm">
            Не вдалося завантажити прев’ю
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold line-clamp-2">{clip.title}</h3>
        <p className="text-sm text-gray-400 mt-1">Автор: {clip.author}</p>
      </div>
    </a>
  );
}
