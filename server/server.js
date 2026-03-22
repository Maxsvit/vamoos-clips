import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

const app = express();

const NEW_SITE_ORIGIN = "https://vamoosnarizky.com";
const LEGACY_HOSTS = new Set(["vamoos-clips.onrender.com"]);

app.use((req, res, next) => {
  const host = (req.get("host") || "").split(":")[0].toLowerCase();
  if (LEGACY_HOSTS.has(host)) {
    const path = req.originalUrl || "/";
    return res.redirect(301, `${NEW_SITE_ORIGIN}${path}`);
  }
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://vamoos-clips.onrender.com",
      NEW_SITE_ORIGIN,
      "https://www.vamoosnarizky.com",
    ],
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../dist")));

const clipsCache = { ts: 0, data: null };
const thumbCache = new Map();
const THUMB_CACHE_TTL = 60 * 60 * 1000;
app.use(express.json());
const FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSc9b146kmNEsIPc1ZUp7k8WBgWmISwrc46UlXLkP600OwxyeA/formResponse";
const SHEETS_CSV =
  "https://docs.google.com/spreadsheets/d/1RWj4fSVFjCKxLb7U2Be6QhGizoOMJd52F0ZgIhdZxlc/export?format=csv&gid=1283374406";

const ENTRY = {
  clipUrl: "entry.526821716",
  title: "entry.498488993",
  author: "entry.200314389",
  note: "entry.2024719700",
};
function isValidHttpUrl(s) {
  try {
    const u = new URL(String(s));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.length);
  if (!lines.length) return { header: [], rows: [] };

  const splitSmart = (line) => {
    const out = [];
    let cur = "",
      inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const header = splitSmart(lines[0]);
  const rows = lines.slice(1).map(splitSmart);
  return { header, rows };
}

const ALLOWED_IMG_HOSTS = new Set([
  "static-cdn.jtvnw.net",
  "clips-media-assets2.twitch.tv",
  "production.assets.clips.twitchcdn.net",
  "twitchcdn.net",
  "clips.twitch.tv",
]);

function isAllowedImgHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (!h) return false;
  if (ALLOWED_IMG_HOSTS.has(h)) return true;
  if (h.endsWith(".jtvnw.net") || h.endsWith(".ttvnw.net")) return true;
  if (h.endsWith(".twitchcdn.net")) return true;
  return false;
}

function getClipSlugFromUrl(raw) {
  try {
    const u = new URL(String(raw).trim());
    if (u.hostname.includes("clips.twitch.tv")) {
      const seg = u.pathname.split("/").filter(Boolean)[0];
      return seg || null;
    }
    const p = u.pathname.split("/").filter(Boolean);
    const i = p.findIndex((x) => x.toLowerCase() === "clip");
    if (i >= 0 && p[i + 1]) return p[i + 1];
  } catch {
    /* ignore */
  }
  return null;
}

const clipThumbBlobCache = new Map();
const CLIP_THUMB_TTL = 60 * 60 * 1000;
const clipThumbInflight = new Map();

const TWITCH_GQL = "https://gql.twitch.tv/gql";
const TWITCH_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

const thumbUrlCache = new Map();

async function batchResolveThumbUrls(slugs) {
  const unknown = slugs.filter(
    (s) => s && !thumbUrlCache.has(s)
  );
  if (unknown.length > 0) {
    const parts = unknown.map(
      (s) => `s${unknown.indexOf(s)}:clip(slug:"${s}"){thumbnailURL}`
    );
    const body = JSON.stringify({ query: `query{${parts.join(" ")}}` });
    try {
      const r = await fetch(TWITCH_GQL, {
        method: "POST",
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          "Content-Type": "application/json",
        },
        body,
      });
      if (r.ok) {
        const json = await r.json();
        const d = json?.data ?? {};
        unknown.forEach((s, i) => {
          const url = d[`s${i}`]?.thumbnailURL ?? null;
          const good = url && !isBadThumb(url) ? url : null;
          thumbUrlCache.set(s, { ts: Date.now(), url: good });
        });
      }
    } catch {
      /* GQL batch failed */
    }
  }
  const result = {};
  for (const s of slugs) {
    const c = thumbUrlCache.get(s);
    result[s] = c?.url ?? null;
  }
  return result;
}

app.get("/api/clips", async (req, res) => {
  try {
    const now = Date.now();
    const force = String(req.query.force || "") === "1";
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(
      30,
      Math.max(1, parseInt(String(req.query.limit ?? "9"), 10) || 9)
    );

    const jsonPage = async (clips) => {
      const start = (page - 1) * pageSize;
      const slice = clips.slice(start, start + pageSize);

      const slugs = slice.map((c) => getClipSlugFromUrl(c.clipUrl)).filter(Boolean);
      let thumbMap = {};
      try {
        thumbMap = await batchResolveThumbUrls(slugs);
      } catch {
        /* non-critical */
      }

      const enriched = slice.map((c) => {
        const slug = getClipSlugFromUrl(c.clipUrl);
        const directUrl = slug ? thumbMap[slug] : null;
        return {
          ...c,
          thumbProxy: directUrl
            ? `/api/img?url=${encodeURIComponent(directUrl)}`
            : c.thumbProxy,
        };
      });

      return {
        success: true,
        clips: enriched,
        total: clips.length,
        page,
        pageSize,
      };
    };

    if (!force && clipsCache.data && now - clipsCache.ts < 10_000) {
      return res.json(await jsonPage(clipsCache.data));
    }

    const csvUrl = `${SHEETS_CSV}${
      SHEETS_CSV.includes("?") ? "&" : "?"
    }_ts=${now}`;

    const r = await fetch(csvUrl, {
      headers: {
        "User-Agent": "VamoosClips/1.0",
        Accept: "text/csv",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("[clips] fetch CSV failed:", r.status, t.slice(0, 200));
      return res.status(502).json({
        success: false,
        error: "CSV fetch failed",
        detail: t.slice(0, 200),
      });
    }

    const csvText = await r.text();
    const { header, rows } = parseCsv(csvText);

    const idx = {
      ts: header.findIndex((h) => /позначка часу|timestamp/i.test(h)),
      url: header.findIndex((h) => /clip\s*url|url\s*кліпу|посилання/i.test(h)),
      title: header.findIndex((h) => /назва|title/i.test(h)),
      author: header.findIndex((h) => /автор|стрімер|author|streamer/i.test(h)),
      note: header.findIndex((h) => /нік|коментар|note|comment/i.test(h)),
    };

    if (idx.url < 0) {
      console.error("[clips] URL column not found. Header =", header);
      return res.json(await jsonPage([]));
    }

    let clips = rows
      .map((cols) => {
        const clipUrl = (cols[idx.url] ?? "").trim();
        if (!clipUrl) return null;
        const slug = getClipSlugFromUrl(clipUrl);
        const thumbProxy = slug
          ? `/api/clip-thumb?slug=${encodeURIComponent(slug)}`
          : null;
        return {
          clipUrl,
          thumbProxy,
          title: (idx.title >= 0 ? (cols[idx.title] ?? "").trim() : "") || "Без назви",
          author:
            (idx.author >= 0 ? (cols[idx.author] ?? "").trim() : "") ||
            "Невідомо",
          note: idx.note >= 0 ? (cols[idx.note] ?? "").trim() : "",
          createdAt: idx.ts >= 0 ? cols[idx.ts] ?? null : null,
        };
      })
      .filter(Boolean);

    function parseDate(str) {
      if (!str) return 0;
      const m = str.match(
        /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
      );
      if (m) {
        const [_, d, mo, y, h, mi, s] = m;
        return new Date(y, mo - 1, d, h, mi, s || 0).getTime();
      }
      return Date.parse(str) || 0;
    }

    const seen = new Set();
    clips = clips.filter((c) =>
      seen.has(c.clipUrl) ? false : (seen.add(c.clipUrl), true)
    );

    clips.sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));

    clipsCache.data = clips;
    clipsCache.ts = now;

    return res.json(await jsonPage(clips));
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, error: "Server parse error" });
  }
});
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: "Забагато запитів, спробуйте пізніше" },
});

app.post("/api/submit", submitLimiter, async (req, res) => {
  try {
    const { clipUrl, title, author, note } = req.body;

    const formData = new URLSearchParams();
    formData.append(ENTRY.clipUrl, clipUrl);
    formData.append(ENTRY.title, title);
    formData.append(ENTRY.author, author);
    formData.append(ENTRY.note, note);

    const response = await fetch(FORM_ACTION, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      clipsCache.ts = 0;
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: "Google Form error" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

function isBadThumb(url) {
  return (
    /twitch_logo/i.test(url) || /ttv-static-metadata\/twitch_logo/i.test(url)
  );
}

const SCRAPE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  Referer: "https://www.twitch.tv/",
};

function extractThumbFromHtml(html) {
  const patterns = [
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1] && !isBadThumb(m[1])) return m[1];
  }

  const ld = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (ld && ld[1]) {
    try {
      const json = JSON.parse(ld[1]);
      const arr = Array.isArray(json) ? json : [json];
      for (const item of arr) {
        const t = item?.thumbnailUrl || item?.thumbnailURL;
        if (Array.isArray(t)) {
          const good = t.find((u) => typeof u === "string" && !isBadThumb(u));
          if (good) return good;
        } else if (typeof t === "string" && !isBadThumb(t)) {
          return t;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const prev = html.match(
    /https?:\/\/[^"' ]+?-preview-(480x272|260x147|86x45)\.jpg/
  );
  if (prev && prev[0] && !isBadThumb(prev[0])) return prev[0];

  const thumb = html.match(/"thumbnail(?:_?url|URL)"\s*:\s*"([^"]+?)"/i);
  if (thumb && thumb[1] && !isBadThumb(thumb[1])) return thumb[1];

  return null;
}

async function fetchThumbViaGql(slug) {
  if (!slug) return null;
  try {
    const body = JSON.stringify({
      query: `query { clip(slug: "${slug}") { thumbnailURL } }`,
    });
    const r = await fetch(TWITCH_GQL, {
      method: "POST",
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        "Content-Type": "application/json",
      },
      body,
    });
    if (!r.ok) return null;
    const json = await r.json();
    const url = json?.data?.clip?.thumbnailURL;
    if (url && !isBadThumb(url)) return url;
  } catch {
    /* GQL unavailable */
  }
  return null;
}

async function scrapeClipThumbUrl(clipUrl) {
  const url = normalizeClipUrl(clipUrl);
  if (!url) return null;

  const slug = getClipSlugFromUrl(clipUrl);
  const gqlThumb = await fetchThumbViaGql(slug);
  if (gqlThumb) return gqlThumb;

  try {
    const r = await fetch(url, { headers: SCRAPE_HEADERS });
    if (!r.ok) return null;
    const html = await r.text();
    return extractThumbFromHtml(html);
  } catch {
    return null;
  }
}

app.get("/api/clip-preview", async (req, res) => {
  try {
    const raw = String(req.query.url ?? "").trim();
    if (
      !raw ||
      raw === "undefined" ||
      raw === "null" ||
      !/^https?:\/\//i.test(raw)
    ) {
      return res.status(400).json({ error: "Bad url" });
    }
    const url = raw;

    const cached = thumbCache.get(url);
    if (cached && Date.now() - cached.ts < THUMB_CACHE_TTL) {
      res.set("Cache-Control", "public, max-age=3600");
      return res.json(cached.payload);
    }

    const thumbnail = await scrapeClipThumbUrl(url);

    const payload = {
      title: null,
      thumbnail_url: thumbnail ?? null,
      author_name: null,
      provider_name: "Twitch",
      _fallback: !thumbnail,
    };

    if (thumbnail) {
      thumbCache.set(url, { ts: Date.now(), payload });
    }

    res.set("Cache-Control", thumbnail ? "public, max-age=3600" : "no-cache");
    return res.json(payload);
  } catch (e) {
    console.error(e);
    return res.json({
      title: null,
      thumbnail_url: null,
      provider_name: "Twitch",
      _fallback: true,
    });
  }
});

async function fetchThumbBufFromUrl(imageUrl) {
  try {
    const r = await fetch(imageUrl, {
      headers: {
        ...SCRAPE_HEADERS,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 400) return null;
    return { buf, type: r.headers.get("content-type") || "image/jpeg" };
  } catch {
    return null;
  }
}

async function resolveClipThumb(slug) {
  const clipUrl = `https://clips.twitch.tv/${slug}`;
  const thumbUrl = await scrapeClipThumbUrl(clipUrl);
  if (!thumbUrl) return null;
  return fetchThumbBufFromUrl(thumbUrl);
}

app.get("/api/clip-thumb", async (req, res) => {
  try {
    const slug = String(req.query.slug ?? "").trim();
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const mem = clipThumbBlobCache.get(slug);
    if (mem && Date.now() - mem.ts < CLIP_THUMB_TTL) {
      res.set("Content-Type", mem.type);
      res.set("Cache-Control", "public, max-age=86400");
      return res.send(mem.buf);
    }

    let job = clipThumbInflight.get(slug);
    if (!job) {
      job = resolveClipThumb(slug).then((result) => {
        if (result) {
          clipThumbBlobCache.set(slug, {
            ts: Date.now(),
            buf: result.buf,
            type: result.type,
          });
        }
        return result;
      });
      clipThumbInflight.set(slug, job);
      job.finally(() => clipThumbInflight.delete(slug));
    }

    const result = await job;
    if (result) {
      res.set("Content-Type", result.type);
      res.set("Cache-Control", "public, max-age=86400");
      return res.send(result.buf);
    }

    return res.status(404).end();
  } catch (e) {
    console.error(e);
    return res.status(404).end();
  }
});
app.get("/api/img", async (req, res) => {
  try {
    const raw = req.query.url;
    if (!raw) return res.status(400).json({ error: "Missing url" });
    const u = new URL(raw);

    if (!isAllowedImgHost(u.hostname)) {
      return res.status(400).json({ error: "Host not allowed" });
    }

    const r = await fetch(u.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.twitch.tv/",
      },
    });

    const buf = Buffer.from(await r.arrayBuffer());
    res.status(r.ok ? 200 : r.status);
    res.set("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.set("Cache-Control", "public, max-age=3600");
    return res.send(buf);
  } catch (e) {
    console.error(e);
    const blank = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
      "base64"
    );
    res.set("Content-Type", "image/png");
    return res.status(200).send(blank);
  }
});
app.get("/api/health", (_req, res) => res.json({ ok: true }));

function normalizeClipUrl(raw) {
  try {
    if (!isValidHttpUrl(raw)) return null;
    const u = new URL(raw);
    const p = u.pathname.split("/").filter(Boolean);
    const i = p.findIndex((x) => x.toLowerCase() === "clip");
    if (i >= 0 && p[i + 1]) return `https://clips.twitch.tv/${p[i + 1]}`;
    if (u.hostname.includes("clips.twitch.tv")) return raw;
  } catch {
    /* invalid URL */
  }
  return null;
}
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
