import { useEffect, useRef, useState } from "react";
import fallbackLogo from "../assets/img/logo.jpg";

function getClipSlug(twitchUrl) {
  try {
    const u = new URL(twitchUrl);
    if (u.hostname.includes("clips.twitch.tv")) {
      const seg = u.pathname.split("/").filter(Boolean)[0];
      return seg || null;
    }
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

function sameAssetUrl(a, b) {
  if (!a || !b) return false;
  try {
    const ua = new URL(
      a,
      typeof window !== "undefined" ? window.location.origin : "http://local"
    );
    const ub = new URL(
      b,
      typeof window !== "undefined" ? window.location.origin : "http://local"
    );
    return ua.pathname + ua.search === ub.pathname + ub.search;
  } catch {
    return a === b;
  }
}

export default function ClipCard({ clip }) {
  const realUrl = (clip?.url ?? clip?.clipUrl ?? "").toString().trim();
  const slug = getClipSlug(realUrl);
  const thumbFromApi = (clip?.thumbProxy ?? "").toString().trim();
  const thumbUrl =
    thumbFromApi ||
    (slug ? `/api/clip-thumb?slug=${encodeURIComponent(slug)}` : "");

  const [src, setSrc] = useState(thumbUrl || fallbackLogo);
  const [failed, setFailed] = useState(false);
  const srcRef = useRef(null);
  srcRef.current = src;

  useEffect(() => {
    setFailed(false);
    setSrc(thumbUrl || fallbackLogo);
  }, [thumbUrl, realUrl]);

  if (!realUrl || !isHttp(realUrl)) {
    return (
      <a
        href={realUrl || "#"}
        className="group block rounded-2xl overflow-hidden bg-[#100818] ring-1 ring-white/[0.07] opacity-80"
      >
        <div className="relative aspect-video overflow-hidden bg-black/40 flex items-center justify-center">
          <img
            src={fallbackLogo}
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="p-4 border-t border-white/[0.06]">
          <h3 className="text-white font-semibold line-clamp-2">{clip.title}</h3>
          <p className="text-sm text-gray-400 mt-1.5">Автор: {clip.author}</p>
        </div>
      </a>
    );
  }

  return (
    <a
      href={realUrl}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-2xl overflow-hidden bg-[#100818] ring-1 ring-white/[0.07] shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:ring-violet-500/40 hover:shadow-[0_16px_48px_rgba(88,28,135,0.2)] transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-video overflow-hidden bg-black/30">
        {!failed && src ? (
          <img
            key={src}
            src={src}
            alt={clip.title}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const current = srcRef.current;
              if (
                current &&
                !sameAssetUrl(e.currentTarget.src, current)
              ) {
                return;
              }
              if (current && current !== fallbackLogo) {
                setSrc(fallbackLogo);
                return;
              }
              setFailed(true);
            }}
          />
        ) : null}

        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-gray-300 text-sm px-2 text-center">
            Не вдалося завантажити прев’ю
          </div>
        ) : null}
      </div>

      <div className="p-4 border-t border-white/[0.06]">
        <h3 className="text-white font-semibold line-clamp-2 leading-snug">
          {clip.title}
        </h3>
        <p className="text-sm text-gray-400 mt-1.5">Автор: {clip.author}</p>
      </div>
    </a>
  );
}
