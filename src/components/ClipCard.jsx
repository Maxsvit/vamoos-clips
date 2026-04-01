import { useEffect, useRef, useState } from "react";
import fallbackLogo from "../assets/img/logo.jpg";
import { publicMediaUrl } from "../lib/apiOrigin";

export function getClipSlug(twitchUrl) {
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

export default function ClipCard({
  clip,
  large = false,
  /** Якщо true — клік по картці не веде на Twitch, а викликає onOpenEmbed (напр. модалка з embed) */
  embedMode = false,
  onOpenEmbed,
}) {
  const realUrl = (clip?.url ?? clip?.clipUrl ?? "").toString().trim();
  const slug = getClipSlug(realUrl);
  const thumbFromApi = (clip?.thumbProxy ?? "").toString().trim();
  const thumbUrl = publicMediaUrl(
    thumbFromApi ||
      (slug ? `/api/clip-thumb?slug=${encodeURIComponent(slug)}` : "")
  );

  const [src, setSrc] = useState(thumbUrl || fallbackLogo);
  const [failed, setFailed] = useState(false);
  const srcRef = useRef(null);
  srcRef.current = src;

  useEffect(() => {
    setFailed(false);
    setSrc(thumbUrl || fallbackLogo);
  }, [thumbUrl, realUrl]);

  const shell = large
    ? "rounded-3xl shadow-[0_20px_56px_rgba(0,0,0,0.45)]"
    : "rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)]";
  const footerPad = large ? "p-6 md:p-8" : "p-4";
  const titleCls = large
    ? "text-white font-bold line-clamp-2 leading-tight text-xl md:text-2xl"
    : "text-white font-semibold line-clamp-2 leading-snug";
  const authorCls = large
    ? "text-base md:text-lg text-gray-400 mt-2 md:mt-2.5"
    : "text-sm text-gray-400 mt-1.5";

  const openEmbed = (e) => {
    if (embedMode && typeof onOpenEmbed === "function") {
      e?.preventDefault?.();
      onOpenEmbed();
    }
  };

  const embedShellClass =
    "group block overflow-hidden bg-[#100818] ring-1 ring-white/[0.07] " +
    "hover:ring-violet-500/40 hover:shadow-[0_16px_48px_rgba(88,28,135,0.2)] transition-all duration-300 " +
    (large ? "hover:-translate-y-1" : "hover:-translate-y-0.5") +
    " " +
    shell;

  if (!realUrl || !isHttp(realUrl)) {
    const useEmbed = embedMode && typeof onOpenEmbed === "function";
    const Tag = useEmbed ? "div" : "a";
    const props = useEmbed
      ? {
            role: "button",
            tabIndex: 0,
            onClick: openEmbed,
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenEmbed();
              }
            },
            "aria-label": "Переглянути кліп",
          }
        : { href: realUrl || "#" };

    return (
      <Tag
        {...props}
        className={
          "group block overflow-hidden bg-[#100818] ring-1 ring-white/[0.07] opacity-80 " +
          shell +
          (useEmbed ? " cursor-pointer" : "")
        }
      >
        <div className="relative aspect-video overflow-hidden bg-black/40 flex items-center justify-center">
          <img
            src={fallbackLogo}
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className={`${footerPad} border-t border-white/[0.06]`}>
          <h3 className={titleCls}>{clip.title}</h3>
          <p className={authorCls}>Автор: {clip.author}</p>
        </div>
      </Tag>
    );
  }

  if (embedMode && typeof onOpenEmbed === "function") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={openEmbed}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenEmbed();
          }
        }}
        aria-label={`Переглянути кліп: ${clip.title || "кліп"}`}
        className={embedShellClass + " cursor-pointer"}
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
            <div
              className={
                "absolute inset-0 flex items-center justify-center bg-black/50 text-gray-300 px-3 text-center " +
                (large ? "text-base md:text-lg" : "text-sm")
              }
            >
              Не вдалося завантажити прев’ю
            </div>
          ) : null}
        </div>

        <div className={`${footerPad} border-t border-white/[0.06]`}>
          <h3 className={titleCls}>{clip.title}</h3>
          <p className={authorCls}>Автор: {clip.author}</p>
        </div>
      </div>
    );
  }

  return (
    <a
      href={realUrl}
      target="_blank"
      rel="noreferrer"
      className={embedShellClass}
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
          <div
            className={
              "absolute inset-0 flex items-center justify-center bg-black/50 text-gray-300 px-3 text-center " +
              (large ? "text-base md:text-lg" : "text-sm")
            }
          >
            Не вдалося завантажити прев’ю
          </div>
        ) : null}
      </div>

      <div className={`${footerPad} border-t border-white/[0.06]`}>
        <h3 className={titleCls}>{clip.title}</h3>
        <p className={authorCls}>Автор: {clip.author}</p>
      </div>
    </a>
  );
}
