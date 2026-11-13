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
  /** Номер у сітці (#01) */
  index,
  /** Картка в сітці з лініями: межі малює сітка (border-l/t), картка — праву й нижню */
  cell = false,
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

  const shell = cell
    ? "border-r border-b border-[var(--vc-line)]"
    : "border border-[var(--vc-line)]";
  const footerPad = large ? "px-1 pt-5 pb-1 md:pt-6" : "px-0.5 pt-4 pb-0.5";
  const titleCls = large
    ? "vc-display m-0 text-[var(--vc-fg)] font-bold uppercase line-clamp-2 leading-tight text-xl md:text-2xl tracking-[-0.01em]"
    : "m-0 text-[var(--vc-fg)] font-bold line-clamp-2 leading-snug text-[16px]";
  const authorCls = large
    ? "vc-mono m-0 text-sm text-[var(--vc-muted)] mt-2.5 uppercase"
    : "vc-mono m-0 text-xs text-[var(--vc-muted)] mt-2 uppercase";
  const indexLabel =
    typeof index === "number" ? (
      <span className="vc-mono pointer-events-none absolute left-0 top-0 z-[1] bg-[var(--vc-bg)] px-2 py-1 text-[11px] text-[var(--vc-fg)]">
        #{String(index).padStart(2, "0")}
      </span>
    ) : null;
  const playLabel = (
    <span className="vc-mono pointer-events-none absolute bottom-0 right-0 z-[1] bg-[var(--vc-accent)] px-2.5 py-1 text-[11px] font-bold text-[var(--vc-bg)] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
      ▶ ДИВИТИСЬ
    </span>
  );

  const openEmbed = (e) => {
    if (embedMode && typeof onOpenEmbed === "function") {
      e?.preventDefault?.();
      onOpenEmbed();
    }
  };

  const embedShellClass =
    "group block bg-[var(--vc-bg)] p-4 text-[var(--vc-fg)] no-underline transition-colors duration-200 hover:bg-[#151515] " +
    (large ? "md:p-5 " : "") +
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
          "group block bg-[var(--vc-bg)] p-4 text-[var(--vc-fg)] no-underline opacity-80 " +
          shell +
          (useEmbed ? " cursor-pointer" : "")
        }
      >
        <div className="relative aspect-video overflow-hidden bg-[#151515] flex items-center justify-center">
          <img
            src={fallbackLogo}
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className={`${footerPad} `}>
          <h3 className={titleCls}>{clip.title}</h3>
          <p className={authorCls}>Стрімер: {clip.author}</p>
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
        <div className="relative aspect-video overflow-hidden bg-[#151515]">
          {indexLabel}
          {playLabel}
          {!failed && src ? (
            <img
              key={src}
              src={src}
              alt={clip.title}
              className="w-full h-full object-cover"
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
                "vc-mono absolute inset-0 flex items-center justify-center bg-[#151515] text-[var(--vc-muted)] px-3 text-center uppercase " +
                (large ? "text-base md:text-lg" : "text-sm")
              }
            >
              Не вдалося завантажити прев’ю
            </div>
          ) : null}
        </div>

        <div className={`${footerPad} `}>
          <h3 className={titleCls}>{clip.title}</h3>
          <p className={authorCls}>Стрімер: {clip.author}</p>
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
      <div className="relative aspect-video overflow-hidden bg-[#151515]">
          {indexLabel}
          {playLabel}
        {!failed && src ? (
          <img
            key={src}
            src={src}
            alt={clip.title}
            className="w-full h-full object-cover"
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
              "vc-mono absolute inset-0 flex items-center justify-center bg-[#151515] text-[var(--vc-muted)] px-3 text-center uppercase " +
              (large ? "text-base md:text-lg" : "text-sm")
            }
          >
            Не вдалося завантажити прев’ю
          </div>
        ) : null}
      </div>

      <div className={`${footerPad} `}>
        <h3 className={titleCls}>{clip.title}</h3>
        <p className={authorCls}>Стрімер: {clip.author}</p>
      </div>
    </a>
  );
}
