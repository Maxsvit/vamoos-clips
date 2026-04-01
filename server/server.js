import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import session from "express-session";
import { createClient } from "@supabase/supabase-js";

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

const CORS_EXTRA = (process.env.CORS_EXTRA_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
      "https://vamoos-clips.onrender.com",
      NEW_SITE_ORIGIN,
      "https://www.vamoosnarizky.com",
      ...CORS_EXTRA,
    ],
    credentials: true,
  })
);

app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../dist")));

const clipsCache = { ts: 0, data: null };
const thumbCache = new Map();
const THUMB_CACHE_TTL = 60 * 60 * 1000;
app.use(express.json());

const SESSION_SECRET =
  process.env.SESSION_SECRET || "dev-session-secret-change-in-production";

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "vamoos.sid",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

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

/** Нормалізує URL кліпу до вигляду clips.twitch.tv/Slug (як у формі додавання кліпів). */
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

const clipThumbBlobCache = new Map();
const CLIP_THUMB_TTL = 60 * 60 * 1000;
const clipThumbInflight = new Map();

const TWITCH_GQL = "https://gql.twitch.tv/gql";
const TWITCH_PUBLIC_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

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
          "Client-ID": TWITCH_PUBLIC_CLIENT_ID,
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

function parseSheetClipDate(str) {
  if (!str) return 0;
  const m = str.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );
  if (m) {
    const [, d, mo, y, h, mi, s] = m;
    return new Date(y, mo - 1, d, h, mi, s || 0).getTime();
  }
  return Date.parse(str) || 0;
}

/** Свіжіші кліпи з таблиці (кеш як у /api/clips). */
async function loadSortedClipsFromSheets(force) {
  const now = Date.now();
  if (!force && clipsCache.data && now - clipsCache.ts < 10_000) {
    return clipsCache.data;
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
    throw new Error(`${r.status}: ${t.slice(0, 200)}`);
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
    clipsCache.data = [];
    clipsCache.ts = now;
    return [];
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

  const seen = new Set();
  clips = clips.filter((c) =>
    seen.has(c.clipUrl) ? false : (seen.add(c.clipUrl), true)
  );

  clips.sort((a, b) => parseSheetClipDate(b.createdAt) - parseSheetClipDate(a.createdAt));

  clipsCache.data = clips;
  clipsCache.ts = now;

  return clips;
}

async function enrichClipsSliceWithThumbs(slice) {
  const slugs = slice.map((c) => getClipSlugFromUrl(c.clipUrl)).filter(Boolean);
  let thumbMap = {};
  try {
    thumbMap = await batchResolveThumbUrls(slugs);
  } catch {
    /* non-critical */
  }
  return slice.map((c) => {
    const slug = getClipSlugFromUrl(c.clipUrl);
    const directUrl = slug ? thumbMap[slug] : null;
    return {
      ...c,
      thumbProxy: directUrl
        ? `/api/img?url=${encodeURIComponent(directUrl)}`
        : c.thumbProxy,
    };
  });
}

/** Шлях до JSON з ручним списком кліпів для «Кліп місяця» (див. clip-month-pool.example.json). */
const CLIP_MONTH_POOL_PATH = path.join(
  __dirname,
  (process.env.CLIP_MONTH_POOL_FILE || "clip-month-pool.json").trim()
);

function clipMonthManualRow(entry) {
  const raw = entry?.clipUrl ?? entry?.url ?? entry?.clip;
  if (raw == null) return null;
  let u = String(raw).trim();
  if (!u) return null;
  const norm = normalizeClipUrl(u);
  if (norm) u = norm;
  if (!isValidHttpUrl(u)) return null;
  const slug = getClipSlugFromUrl(u);
  const thumbProxy = slug
    ? `/api/clip-thumb?slug=${encodeURIComponent(slug)}`
    : null;
  const title = String(entry?.title ?? "").trim() || "Без назви";
  const author = String(entry?.author ?? "").trim() || "Невідомо";
  return {
    clipUrl: u,
    thumbProxy,
    title,
    author,
    note: "",
    createdAt: null,
  };
}

/** Якщо clip-month-pool.json існує і enabled: true — повертає масив кліпів; інакше null (тоді беремо Google Sheets). */
async function readClipMonthManualPoolOrNull() {
  try {
    const raw = await fs.readFile(CLIP_MONTH_POOL_PATH, "utf8");
    const j = JSON.parse(raw);
    if (!j || j.enabled !== true) return null;
    let rawItems = [];
    if (Array.isArray(j.clips)) rawItems = j.clips;
    else if (Array.isArray(j.urls))
      rawItems = j.urls.map((u) =>
        typeof u === "string" ? { clipUrl: u } : u
      );
    const out = [];
    const seen = new Set();
    for (const it of rawItems) {
      const row = clipMonthManualRow(it);
      if (!row) continue;
      if (seen.has(row.clipUrl)) continue;
      seen.add(row.clipUrl);
      out.push(row);
    }
    if (out.length === 0) {
      console.warn(
        "[clip-month-pool] enabled=true, але немає валідних посилань — використовуємо таблицю Google"
      );
      return null;
    }
    console.log("[clip-month-pool] ручний пул:", out.length, "кліпів");
    return out;
  } catch (e) {
    if (e.code === "ENOENT") return null;
    console.error("[clip-month-pool]", e.message);
    return null;
  }
}

async function loadClipsForClipMonth() {
  const manual = await readClipMonthManualPoolOrNull();
  if (manual) return { clips: manual, source: "manual" };
  const clips = await loadSortedClipsFromSheets(false);
  return { clips, source: "sheets" };
}

app.get("/api/clips", async (req, res) => {
  try {
    const force = String(req.query.force || "") === "1";
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(
      30,
      Math.max(1, parseInt(String(req.query.limit ?? "9"), 10) || 9)
    );

    let clips;
    try {
      clips = await loadSortedClipsFromSheets(force);
    } catch (e) {
      console.error("[clips] fetch CSV failed:", e);
      return res.status(502).json({
        success: false,
        error: "CSV fetch failed",
        detail: String(e.message || e).slice(0, 200),
      });
    }

    const start = (page - 1) * pageSize;
    const slice = clips.slice(start, start + pageSize);
    const enriched = await enrichClipsSliceWithThumbs(slice);

    return res.json({
      success: true,
      clips: enriched,
      total: clips.length,
      page,
      pageSize,
    });
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
        "Client-ID": TWITCH_PUBLIC_CLIENT_ID,
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

/* --- Twitch OAuth (сесія; для гри та майбутнього голосування) --- */
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || "";
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI || "";
/** Після OAuth відкривати фронт на іншому порту (Vite), напр. http://localhost:5173 або :5000 */
const APP_PUBLIC_URL = (process.env.APP_PUBLIC_URL || "").replace(/\/$/, "");

function twitchOAuthReady() {
  return !!(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET && TWITCH_REDIRECT_URI);
}

app.get("/api/auth/me", (req, res) => {
  const u = req.session.twitchUser;
  if (!u) {
    return res.json({ user: null });
  }
  return res.json({
    user: {
      id: u.id,
      login: u.login,
      displayName: u.displayName,
      profileImageUrl: u.profileImageUrl,
    },
  });
});

app.get("/auth/twitch", (req, res) => {
  if (!twitchOAuthReady()) {
    return res
      .status(503)
      .type("text/plain; charset=utf-8")
      .send(
        "Twitch OAuth не налаштовано. Задай змінні TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_REDIRECT_URI."
      );
  }
  let returnTo = "/clip-of-month";
  const rt = req.query.returnTo;
  if (typeof rt === "string" && rt.startsWith("/") && !rt.startsWith("//")) {
    returnTo = rt.slice(0, 512);
  }
  req.session.returnTo = returnTo;
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT_URI,
    response_type: "code",
    scope: "user:read:email",
    state,
  });
  res.redirect(`https://id.twitch.tv/oauth2/authorize?${params}`);
});

app.get("/auth/twitch/callback", async (req, res) => {
  if (!twitchOAuthReady()) {
    return res.redirect("/?oauth_error=config");
  }
  const { code, state, error, error_description: errDesc } = req.query;
  if (error) {
    console.error("[twitch oauth]", error, errDesc);
    return res.redirect("/?oauth_error=denied");
  }
  if (
    typeof code !== "string" ||
    typeof state !== "string" ||
    state !== req.session.oauthState
  ) {
    return res.redirect("/?oauth_error=state");
  }
  delete req.session.oauthState;

  try {
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: TWITCH_REDIRECT_URI,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("[twitch token]", tokenJson);
      return res.redirect("/?oauth_error=token");
    }
    const accessToken = tokenJson.access_token;

    const userRes = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": TWITCH_CLIENT_ID,
      },
    });
    const userJson = await userRes.json();
    if (!userRes.ok || !userJson.data?.[0]) {
      console.error("[twitch user]", userJson);
      return res.redirect("/?oauth_error=user");
    }
    const row = userJson.data[0];
    req.session.twitchUser = {
      id: row.id,
      login: row.login,
      displayName: row.display_name,
      profileImageUrl: row.profile_image_url,
    };
    req.session.twitchAccessToken = accessToken;

    const back =
      typeof req.session.returnTo === "string"
        ? req.session.returnTo
        : "/clip-of-month";
    delete req.session.returnTo;
    const safeBack =
      typeof back === "string" &&
      back.startsWith("/") &&
      !back.startsWith("//") &&
      back.length <= 512
        ? back
        : "/clip-of-month";
    const target =
      APP_PUBLIC_URL && safeBack.startsWith("/")
        ? `${APP_PUBLIC_URL}${safeBack}`
        : safeBack;
    res.redirect(target);
  } catch (e) {
    console.error("[twitch callback]", e);
    res.redirect("/?oauth_error=server");
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.json({ success: true });
  });
});

/* --- «Кліп місяця»: голосування (макс. 10 останніх з таблиці; CLIP_MONTH_VOTE_POOL у .env, 5–10) --- */
const CLIP_MONTH_ROUND_ID =
  process.env.CLIP_MONTH_ROUND_ID || "clip-month-round-test-1";
const CLIP_MONTH_VOTES_FILE = path.join(__dirname, "clip-month-votes.json");
const CLIP_MONTH_VOTE_POOL_MAX = 10;
const CLIP_MONTH_VOTE_POOL = Math.min(
  CLIP_MONTH_VOTE_POOL_MAX,
  Math.max(
    5,
    parseInt(
      String(process.env.CLIP_MONTH_VOTE_POOL ?? String(CLIP_MONTH_VOTE_POOL_MAX)),
      10
    ) || CLIP_MONTH_VOTE_POOL_MAX
  )
);
const CLIP_MONTH_PICKS = Math.min(
  10,
  Math.max(1, parseInt(String(process.env.CLIP_MONTH_PICKS ?? "3"), 10) || 3)
);

function clipMonthVoteKey(clipUrl) {
  const slug = getClipSlugFromUrl(clipUrl);
  if (slug) return `s:${slug}`;
  return `u:${String(clipUrl).trim()}`;
}

async function readClipMonthVoteState() {
  try {
    const raw = await fs.readFile(CLIP_MONTH_VOTES_FILE, "utf8");
    const j = JSON.parse(raw);
    if (j.roundId !== CLIP_MONTH_ROUND_ID) {
      return {
        roundId: CLIP_MONTH_ROUND_ID,
        byTwitchId: {},
        tallies: {},
      };
    }
    return {
      roundId: CLIP_MONTH_ROUND_ID,
      byTwitchId:
        typeof j.byTwitchId === "object" && j.byTwitchId ? j.byTwitchId : {},
      tallies: typeof j.tallies === "object" && j.tallies ? j.tallies : {},
    };
  } catch {
    return {
      roundId: CLIP_MONTH_ROUND_ID,
      byTwitchId: {},
      tallies: {},
    };
  }
}

async function writeClipMonthVoteState(state) {
  try {
    await fs.writeFile(
      CLIP_MONTH_VOTES_FILE,
      JSON.stringify(state, null, 2),
      "utf8"
    );
  } catch (e) {
    console.error("[clip-month votes] write failed:", CLIP_MONTH_VOTES_FILE, e);
    throw e;
  }
}

/** Попередні голоси користувача: масив ключів або legacy — один рядок. */
function clipMonthPrevVoteKeys(state, uid) {
  const v = state.byTwitchId[uid];
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string" && x);
  if (typeof v === "string" && v) return [v];
  return [];
}

function clipMonthRemoveUserVotesFromTallies(state, uid) {
  for (const key of clipMonthPrevVoteKeys(state, uid)) {
    state.tallies[key] = Math.max(0, (state.tallies[key] || 0) - 1);
  }
}

/* --- Supabase для голосів (якщо задано SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) --- */
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
).trim();

let supabaseVoteClient = null;
function getSupabaseVoteClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!supabaseVoteClient) {
    supabaseVoteClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseVoteClient;
}

async function clipMonthSupabaseFetchRound(sb, roundId, allowedKeysSet, uid) {
  const { data, error } = await sb
    .from("clip_month_ballots")
    .select("twitch_user_id, vote_keys")
    .eq("round_id", roundId);
  if (error) {
    console.error("[clip-month supabase] select", error);
    throw error;
  }
  const tallies = {};
  for (const k of allowedKeysSet) tallies[k] = 0;
  let myVoteKeys = [];
  for (const row of data || []) {
    const ru = String(row.twitch_user_id ?? "");
    const keys = Array.isArray(row.vote_keys)
      ? row.vote_keys.filter((x) => typeof x === "string")
      : [];
    if (uid && ru === uid) myVoteKeys = keys;
    for (const k of keys) {
      if (allowedKeysSet.has(k)) tallies[k] = (tallies[k] || 0) + 1;
    }
  }
  return { tallies, myVoteKeys };
}

function clipMonthTitlesForPicks(slice, urlList) {
  return urlList.map((url) => {
    const key = clipMonthVoteKey(url);
    const row = slice.find((c) => clipMonthVoteKey(c.clipUrl) === key);
    const t = (row?.title || "Без назви").trim();
    return t.length > 500 ? `${t.slice(0, 497)}…` : t;
  });
}

async function clipMonthSupabaseUpsertBallot(
  sb,
  roundId,
  uid,
  voteKeys,
  { twitchLogin, clipTitles } = {}
) {
  const payload = {
    round_id: roundId,
    twitch_user_id: uid,
    vote_keys: voteKeys,
    updated_at: new Date().toISOString(),
  };
  if (typeof twitchLogin === "string") {
    payload.twitch_login = twitchLogin.slice(0, 128);
  }
  if (Array.isArray(clipTitles) && clipTitles.length === voteKeys.length) {
    payload.clip_titles = clipTitles;
  }
  const { error } = await sb.from("clip_month_ballots").upsert(payload, {
    onConflict: "round_id,twitch_user_id",
  });
  if (error) {
    console.error("[clip-month supabase] upsert", error);
    throw error;
  }
}

const CLIP_MONTH_ALREADY_VOTED_MSG =
  "Ти вже віддав голос у цьому турі. Повторного голосування в одному раунді немає.";

/** Чи вже збережено повний бюлетень (один голос на раунд, без перезапису). */
async function clipMonthUserAlreadyBalloted(sb, roundId, uid) {
  if (!uid) return false;
  if (sb) {
    const { data, error } = await sb
      .from("clip_month_ballots")
      .select("vote_keys")
      .eq("round_id", roundId)
      .eq("twitch_user_id", uid)
      .maybeSingle();
    if (error) {
      console.error("[clip-month] read ballot", error);
      return false;
    }
    const keys = Array.isArray(data?.vote_keys)
      ? data.vote_keys.filter((x) => typeof x === "string")
      : [];
    return keys.length >= CLIP_MONTH_PICKS;
  }
  try {
    const state = await readClipMonthVoteState();
    if (state.roundId !== roundId) return false;
    const prev = state.byTwitchId[uid];
    const keys = Array.isArray(prev)
      ? prev.filter((x) => typeof x === "string")
      : [];
    return keys.length >= CLIP_MONTH_PICKS;
  } catch {
    return false;
  }
}

const clipMonthVotePostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, error: "Забагато спроб голосування" },
});

app.get("/api/clip-month/vote-board", async (req, res) => {
  try {
    let clips;
    let poolSource = "sheets";
    try {
      const loaded = await loadClipsForClipMonth();
      clips = loaded.clips;
      poolSource = loaded.source;
    } catch (e) {
      console.error("[vote-board]", e);
      return res.status(502).json({
        success: false,
        error: "Не вдалося завантажити кліпи",
      });
    }

    const slice = clips.slice(0, CLIP_MONTH_VOTE_POOL);
    const enriched = await enrichClipsSliceWithThumbs(slice);
    const boardClips = enriched.slice(0, CLIP_MONTH_VOTE_POOL_MAX);
    const allowedKeys = new Set(
      boardClips.map((c) => clipMonthVoteKey(c.clipUrl))
    );

    const tu = req.session?.twitchUser;
    const uid = tu?.id != null ? String(tu.id) : "";
    let myVoteKeys = [];
    const tallies = {};
    for (const k of allowedKeys) tallies[k] = 0;

    const sb = getSupabaseVoteClient();
    if (sb) {
      try {
        const agg = await clipMonthSupabaseFetchRound(
          sb,
          CLIP_MONTH_ROUND_ID,
          allowedKeys,
          uid
        );
        for (const k of allowedKeys) tallies[k] = agg.tallies[k] ?? 0;
        myVoteKeys = agg.myVoteKeys;
      } catch {
        return res.status(500).json({
          success: false,
          error: "Не вдалося прочитати голоси з бази (Supabase).",
        });
      }
    } else {
      const state = await readClipMonthVoteState();
      if (uid && state.byTwitchId[uid] != null) {
        myVoteKeys = clipMonthPrevVoteKeys(state, uid);
      }
      for (const k of allowedKeys) {
        tallies[k] = state.tallies[k] ?? 0;
      }
    }

    return res.json({
      success: true,
      roundId: CLIP_MONTH_ROUND_ID,
      poolSize: CLIP_MONTH_VOTE_POOL,
      picksRequired: CLIP_MONTH_PICKS,
      poolSource,
      votesStorage: sb ? "supabase" : "file",
      clips: boardClips.map((c) => {
        const voteKey = clipMonthVoteKey(c.clipUrl);
        return {
          clipUrl: c.clipUrl,
          title: c.title,
          author: c.author,
          thumbProxy: c.thumbProxy,
          voteKey,
          votes: tallies[voteKey] ?? 0,
        };
      }),
      myVoteKeys,
    });
  } catch (e) {
    console.error("[vote-board]", e);
    return res.status(500).json({ success: false, error: "Помилка сервера" });
  }
});

app.post("/api/clip-month/vote", clipMonthVotePostLimiter, async (req, res) => {
  try {
    const tu = req.session?.twitchUser;
    if (!tu || tu.id === undefined || tu.id === null) {
      return res.status(401).json({
        success: false,
        error: "Увійди через Twitch, щоб голосувати",
      });
    }

    const uid = String(tu.id);
    const rawList = req.body?.clipUrls ?? req.body?.clipURLS;
    let urlList = Array.isArray(rawList)
      ? rawList.map((u) => String(u ?? "").trim()).filter(Boolean)
      : [];

    if (urlList.length === 0 && req.body?.clipUrl) {
      urlList = [String(req.body.clipUrl).trim()].filter(Boolean);
    }

    if (urlList.length !== CLIP_MONTH_PICKS) {
      return res.status(400).json({
        success: false,
        error: `Обери рівно ${CLIP_MONTH_PICKS} різні кліпи й натисни «Підтвердити голос».`,
      });
    }

    if (new Set(urlList).size !== CLIP_MONTH_PICKS) {
      return res.status(400).json({
        success: false,
        error: `Усі ${CLIP_MONTH_PICKS} кліпи мають бути різними.`,
      });
    }

    for (const u of urlList) {
      if (!isValidHttpUrl(u)) {
        return res.status(400).json({
          success: false,
          error: "Некоректне посилання на кліп",
        });
      }
    }

    let clips;
    try {
      clips = (await loadClipsForClipMonth()).clips;
    } catch {
      return res.status(502).json({
        success: false,
        error: "Не вдалося перевірити список кліпів",
      });
    }

    const slice = clips.slice(0, CLIP_MONTH_VOTE_POOL);
    const allowedKeys = new Set(slice.map((c) => clipMonthVoteKey(c.clipUrl)));

    const newKeys = urlList.map((u) => clipMonthVoteKey(u));
    if (new Set(newKeys).size !== CLIP_MONTH_PICKS) {
      return res.status(400).json({
        success: false,
        error: "Не можна обрати два рази той самий кліп (різні посилання).",
      });
    }

    for (const k of newKeys) {
      if (!allowedKeys.has(k)) {
        return res.status(400).json({
          success: false,
          error: "Один із кліпів не з поточного списку для голосування.",
        });
      }
    }

    const sb = getSupabaseVoteClient();
    const alreadyBalloted = await clipMonthUserAlreadyBalloted(
      sb,
      CLIP_MONTH_ROUND_ID,
      uid
    );
    if (alreadyBalloted) {
      return res.status(403).json({
        success: false,
        error: CLIP_MONTH_ALREADY_VOTED_MSG,
      });
    }

    const clipTitles = clipMonthTitlesForPicks(slice, urlList);
    const twitchLogin = String(tu.login || tu.displayName || "").trim() || null;

    if (sb) {
      try {
        await clipMonthSupabaseUpsertBallot(
          sb,
          CLIP_MONTH_ROUND_ID,
          uid,
          newKeys,
          { twitchLogin, clipTitles }
        );
      } catch {
        return res.status(500).json({
          success: false,
          error: "Не вдалося зберегти голос у Supabase.",
        });
      }
    } else {
      let state = await readClipMonthVoteState();
      if (state.roundId !== CLIP_MONTH_ROUND_ID) {
        state = {
          roundId: CLIP_MONTH_ROUND_ID,
          byTwitchId: {},
          tallies: {},
        };
      }
      clipMonthRemoveUserVotesFromTallies(state, uid);
      for (const k of newKeys) {
        state.tallies[k] = (state.tallies[k] || 0) + 1;
      }
      state.byTwitchId[uid] = newKeys;
      await writeClipMonthVoteState(state);
    }

    const enriched = await enrichClipsSliceWithThumbs(slice);
    const boardEnriched = enriched.slice(0, CLIP_MONTH_VOTE_POOL_MAX);
    let clipsOut;
    if (sb) {
      let talliesOut = {};
      try {
        const agg = await clipMonthSupabaseFetchRound(
          sb,
          CLIP_MONTH_ROUND_ID,
          allowedKeys,
          uid
        );
        talliesOut = agg.tallies;
      } catch {
        for (const k of allowedKeys) talliesOut[k] = 0;
      }
      clipsOut = boardEnriched.map((c) => {
        const k = clipMonthVoteKey(c.clipUrl);
        return {
          clipUrl: c.clipUrl,
          title: c.title,
          author: c.author,
          thumbProxy: c.thumbProxy,
          voteKey: k,
          votes: talliesOut[k] ?? 0,
        };
      });
    } else {
      const state = await readClipMonthVoteState();
      clipsOut = boardEnriched.map((c) => {
        const k = clipMonthVoteKey(c.clipUrl);
        return {
          clipUrl: c.clipUrl,
          title: c.title,
          author: c.author,
          thumbProxy: c.thumbProxy,
          voteKey: k,
          votes: state.tallies[k] ?? 0,
        };
      });
    }

    return res.json({
      success: true,
      myVoteKeys: newKeys,
      clips: clipsOut,
      roundId: CLIP_MONTH_ROUND_ID,
      picksRequired: CLIP_MONTH_PICKS,
      votesStorage: sb ? "supabase" : "file",
    });
  } catch (e) {
    console.error("[clip-month vote]", e);
    return res
      .status(500)
      .json({ success: false, error: "Не вдалося зберегти голос" });
  }
});

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error:
      "Невідомий API-запит. Онови код бекенда й перезапусти сервер (npm run server) або задеплой останню збірку.",
  });
});

app.get(/^\/(?!api\/)(?!auth\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
