import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import crypto from "crypto";
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://vamoos-clips.onrender.com"],
    credentials: true, // важливо для кукі
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "https://vamoos-clips.onrender.com";

app.use(express.static(path.join(__dirname, "../dist")));
app.use(express.json());
app.use(cookieParser());

const clipsCache = { ts: 0, data: null };

const FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSc9b146kmNEsIPc1ZUp7k8WBgWmISwrc46UlXLkP600OwxyeA/formResponse";

const SHEETS_CSV =
  "https://docs.google.com/spreadsheets/d/1RWj4fSVFjCKxLb7U2Be6QhGizoOMJd52F0ZgIhdZxlc/export?format=csv&gid=1283374406";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScRb2IZ0OwFISkJkjWTvC0cvO3dQuh3tUn179on_mEgrJ7Y0w/formResponse";

const ENTRY = {
  clipUrl: "entry.526821716",
  title: "entry.498488993",
  author: "entry.200314389",
  note: "entry.2024719700",
};

// ---------- helpers ----------

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
    let cur = "";
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
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

function isBadThumb(url) {
  return (
    /twitch_logo/i.test(url) || /ttv-static-metadata\/twitch_logo/i.test(url)
  );
}
function normalizeClipUrl(raw) {
  try {
    if (!isValidHttpUrl(raw)) return null;
    const u = new URL(raw);
    const p = u.pathname.split("/").filter(Boolean);
    const i = p.findIndex((x) => x.toLowerCase() === "clip");

    if (i >= 0 && p[i + 1]) {
      return `https://clips.twitch.tv/${p[i + 1]}`;
    }
    if (u.hostname.includes("clips.twitch.tv")) {
      return raw;
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchBestThumb(clipUrl) {
  if (!isValidHttpUrl(clipUrl)) return null;

  const url = normalizeClipUrl(clipUrl);
  if (!url) return null;

  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: "https://www.twitch.tv/",
    },
  });

  if (!r.ok) return null;

  const html = await r.text();

  // og:image
  let m = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  );
  if (m && m[1] && !isBadThumb(m[1])) return m[1];

  // ld+json
  m = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (m && m[1]) {
    try {
      const json = JSON.parse(m[1]);
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
      // ignore
    }
  }

  // fallback patterns
  m = html.match(/https?:\/\/[^"' ]+?-preview-(480x272|260x147|86x45)\.jpg/);
  if (m && m[0] && !isBadThumb(m[0])) return m[0];

  m = html.match(/"thumbnail(?:_?url|URL)"\s*:\s*"([^"]+?)"/i);
  if (m && m[1] && !isBadThumb(m[1])) return m[1];

  return null;
}

async function sendVote({
  categoryId,
  categoryTitle,
  nomineeId,
  nomineeName,
  voterToken,
  userAgent,
  nickname
}) {
  const body = new URLSearchParams({
    "entry.502372731": categoryId, // category_id
    "entry.1914997477": categoryTitle, // category_title
    "entry.16942283": nomineeId, // nominee_id
    "entry.604386318": nomineeName, // nominee_name
    "entry.776989716": voterToken, // voter_token
    "entry.1647074345": userAgent, // user_agent
    "entry.1714317894": nickname, // user_agent    
  });

  try {
    const res = await fetch(FORM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
    });

    if (!res.ok) {
      console.error(
        "[sendVote] Google Form returned",
        res.status,
        res.statusText
      );
    }

    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error("[sendVote] network error", err);
    return { ok: false, status: 0 };
  }
}

// ==== TWITCH AUTH CONFIG ====

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || "";
const TWITCH_REDIRECT_URI =
  process.env.TWITCH_REDIRECT_URI ||
  "https://vamoos-clips.onrender.com/api/auth/twitch/callback";

function getTwitchUserFromReq(req) {
  const raw = req.cookies?.twitch_user;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------- Twitch login ----------

app.get("/api/auth/twitch/login", (req, res) => {
  if (!TWITCH_CLIENT_ID || !TWITCH_REDIRECT_URI) {
    return res.status(500).send("Twitch auth is not configured");
  }

  const state = crypto.randomBytes(16).toString("hex");

  // за замовчуванням /viewers-choice
  const next =
    typeof req.query.next === "string" ? req.query.next : "/viewers-choice";

  res.cookie("twitch_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
  });

  res.cookie("twitch_oauth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT_URI,
    response_type: "code",
    scope: "",
    state,
  });

  res.redirect(`https://id.twitch.tv/oauth2/authorize?${params.toString()}`);
});

app.get("/api/auth/twitch/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).send("Missing code");
    }

    const storedState = req.cookies?.twitch_oauth_state;
    if (!state || state !== storedState) {
      return res.status(400).send("Bad state");
    }

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

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Twitch token error", tokenData);
      return res.status(500).send("Twitch auth error");
    }

    const accessToken = tokenData.access_token;

    const userRes = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-Id": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.data || !userData.data.length) {
      console.error("Twitch user error", userData);
      return res.status(500).send("Twitch user error");
    }

    const user = userData.data[0];
    const twitchUser = {
      id: user.id,
      login: user.login,
      display_name: user.display_name,
      profile_image_url: user.profile_image_url,
    };

    res.cookie("twitch_user", JSON.stringify(twitchUser), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.clearCookie("twitch_oauth_state");
    const rawNext = req.cookies?.twitch_oauth_next || "/viewers-choice";
    res.clearCookie("twitch_oauth_next");

    const next =
      typeof rawNext === "string" && rawNext.startsWith("/")
        ? rawNext
        : "/viewers-choice";

    // 🔥 головна штука: редірект на фронтовий origin
    if (FRONTEND_ORIGIN) {
      return res.redirect(FRONTEND_ORIGIN + next);
    }

    // fallback – той самий origin (8080)
    return res.redirect(next);
  } catch (e) {
    console.error("Twitch callback error", e);
    res.status(500).send("Twitch callback error");
  }
});

app.get("/api/auth/twitch/me", (req, res) => {
  const user = getTwitchUserFromReq(req);
  if (!user) return res.json({ loggedIn: false });
  return res.json({ loggedIn: true, user });
});

app.post("/api/auth/twitch/logout", (req, res) => {
  res.clearCookie("twitch_user");
  return res.json({ ok: true });
});

// ---------- /api/clips ----------

app.get("/api/clips", async (req, res) => {
  try {
    const now = Date.now();
    const force = String(req.query.force || "") === "1";

    if (!force && clipsCache.data && now - clipsCache.ts < 10_000) {
      return res.json({ success: true, clips: clipsCache.data });
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
      return res.json({ success: true, clips: [] });
    }

    let clips = rows
      .map((cols) => {
        const clipUrl = (cols[idx.url] ?? "").trim();
        if (!clipUrl) return null;

        return {
          clipUrl,
          title:
            (idx.title >= 0 ? (cols[idx.title] ?? "").trim() : "") ||
            "Без назви",
          author:
            (idx.author >= 0 ? (cols[idx.author] ?? "").trim() : "") ||
            "Невідомо",
          note: idx.note >= 0 ? (cols[idx.note] ?? "").trim() : "",
          createdAt: idx.ts >= 0 ? (cols[idx.ts] ?? "").trim() : null,
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
    clips = clips.slice(0, 9);

    clipsCache.data = clips;
    clipsCache.ts = now;

    return res.json({ success: true, clips });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, error: "Server parse error" });
  }
});

// ---------- rate limiters ----------

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: "Забагато запитів, спробуйте пізніше" },
});

// ОКРЕМИЙ ліміт для голосування
const awardsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // 60 запитів/хв з одного IP (7+ повних голосувань)
  message: { status: "error", message: "Забагато голосів, спробуй пізніше" },
});

// ---------- /api/viewers-choice ----------

const awardsMemory = new Set(); // простий анти-дубль у пам'яті сервера

app.post("/api/viewers-choice", awardsLimiter, async (req, res) => {
  
  try {
    const twitchUser = getTwitchUserFromReq(req);
    if (!twitchUser || !twitchUser.id) {
      return res
        .status(401)
        .json({ status: "error", message: "AUTH_REQUIRED" });
    }

    const { categoryId, categoryTitle, nomineeId, nomineeName,nickname } = req.body || {};

    if (!categoryId || !nomineeId) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing required fields" });
    }

    const voterToken = `twitch:${twitchUser.id}`;
    const userAgent = req.headers["user-agent"] || "";

    const key = `${categoryId}::${voterToken}`;
    if (awardsMemory.has(key)) {
      return res.json({ status: "duplicate" });
    }
    console.log("vote body:", {
      categoryId,
      nomineeId,
      nickname,
      twitchUser,
    });

    const result = await sendVote({
      categoryId,
      categoryTitle: categoryTitle || "",
      nomineeId,
      nomineeName: nomineeName || "",
      voterToken,
      userAgent,
      nickname
    });

    if (!result.ok) {
      return res.status(200).json({
        status: "error",
        message: "Google Form не прийняла голос (status " + result.status + ")",
      });
    }

    awardsMemory.add(key);
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("Streamer awards error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Server error submitting vote" });
  }
});

// ---------- /api/submit (кліпи) ----------

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

// кеш аватарок в пам'яті
const twitchAvatarCache = new Map();

async function fetchTwitchAvatar(login) {
  const key = String(login || "").trim().toLowerCase();
  if (!key) return null;

  const now = Date.now();
  const cached = twitchAvatarCache.get(key);
  if (cached && now - cached.ts < 60 * 60 * 1000) {
    return cached.url;
  }

  const pageUrl = `https://www.twitch.tv/${encodeURIComponent(key)}`;

  try {
    // Додаємо timeout через AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд timeout

    const r = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: "https://www.twitch.tv/",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!r.ok) {
      return null;
    }

    const html = await r.text();

    // Метод 1: og:image meta тег
    let m = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );
    if (m && m[1] && !m[1].includes("twitch_logo")) {
      const url = m[1];
      twitchAvatarCache.set(key, { url, ts: now });
      return url;
    }

    // Метод 2: twitter:image meta тег
    m = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
    );
    if (m && m[1] && !m[1].includes("twitch_logo")) {
      const url = m[1];
      twitchAvatarCache.set(key, { url, ts: now });
      return url;
    }

    // Метод 3: JSON-LD
    m = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (m && m[1]) {
      try {
        const json = JSON.parse(m[1]);
        const arr = Array.isArray(json) ? json : [json];
        for (const item of arr) {
          const img = item?.image || item?.thumbnailUrl || item?.thumbnailURL;
          if (
            typeof img === "string" &&
            img.startsWith("http") &&
            !img.includes("twitch_logo")
          ) {
            twitchAvatarCache.set(key, { url: img, ts: now });
            return img;
          }
          if (img && typeof img === "object" && img.url && typeof img.url === "string") {
            if (img.url.startsWith("http") && !img.url.includes("twitch_logo")) {
              twitchAvatarCache.set(key, { url: img.url, ts: now });
              return img.url;
            }
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    }

    // Метод 4
    m = html.match(
      /data-a-target=["']user-avatar["'][^>]*src=["']([^"']+)["']/i
    );
    if (m && m[1] && !m[1].includes("twitch_logo")) {
      const url = m[1];
      twitchAvatarCache.set(key, { url, ts: now });
      return url;
    }

    // Метод 5
    m = html.match(/profileImageURL["']?\s*[:=]\s*["']([^"']+)["']/i);
    if (m && m[1] && !m[1].includes("twitch_logo")) {
      const url = m[1];
      twitchAvatarCache.set(key, { url, ts: now });
      return url;
    }

    // Метод 6
    m = html.match(
      /https?:\/\/static-cdn\.jtvnw\.net\/jtv_user_pictures\/([^"'\s<>]+)/i
    );
    if (m && m[0] && !m[0].includes("twitch_logo")) {
      const url = m[0];
      twitchAvatarCache.set(key, { url, ts: now });
      return url;
    }

    // Метод 7
    m = html.match(
      /<img[^>]*(?:class|data-a-target)=[^>]*avatar[^>]*src=["']([^"']+)["']/i
    );
    if (
      m &&
      m[1] &&
      !m[1].includes("twitch_logo") &&
      m[1].includes("jtvnw.net")
    ) {
      const url = m[1];
      twitchAvatarCache.set(key, { url, ts: now });
      return url;
    }

    // Метод 8
    const allJtvnwMatches = html.matchAll(
      /https?:\/\/[^"'\s<>]*jtvnw\.net[^"'\s<>]*/gi
    );
    for (const match of allJtvnwMatches) {
      const url = match[0];
      if (url && !url.includes("twitch_logo") && url.includes("user_pictures")) {
        twitchAvatarCache.set(key, { url, ts: now });
        return url;
      }
    }
  } catch (e) {
    if (e.name === "AbortError") {
      // timeout
    }
  }

  return null;
}

// === РОУТ ДЛЯ ФРОНТА ===
app.get("/api/twitch-avatar", async (req, res) => {
  try {
    const login = String(req.query.login || "").trim().toLowerCase();
    if (!login) {
      return res.status(400).json({ error: "Missing login" });
    }

    const url = await fetchTwitchAvatar(login);
    if (!url) {
      return res.status(404).json({ error: "Avatar not found" });
    }

    return res.json({ url });
  } catch (e) {
    console.error("[avatar] route error", e);
    return res.status(500).json({ error: "Avatar fetch error" });
  }
});

// ---------- /api/clip-preview ----------

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
    let data = null;

    try {
      const oe =
        "https://clips.twitch.tv/oembed?format=json&url=" +
        encodeURIComponent(url);
      const r = await fetch(oe, {
        headers: {
          Accept: "application/json",
          "User-Agent": "VamoosClips/1.0",
        },
      });
      if (r.ok) data = await r.json();
    } catch {
      // ignore
    }

    let thumbnail = data?.thumbnail_url ?? null;
    if (!thumbnail || isBadThumb(thumbnail)) {
      thumbnail = await fetchBestThumb(url);
    }

    return res.json({
      title: data?.title ?? null,
      thumbnail_url: thumbnail ?? null,
      author_name: data?.author_name ?? null,
      provider_name: "Twitch",
      _fallback: !data || !data?.thumbnail_url,
    });
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

// ---------- /api/clip-thumb ----------

app.get("/api/clip-thumb", async (req, res) => {
  try {
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const sizes = ["480x272", "260x147", "86x45"];
    let ok = false;
    let buf = null;
    let type = "image/jpeg";

    for (const sz of sizes) {
      const cdnUrl = `https://clips-media-assets2.twitch.tv/${encodeURIComponent(
        slug
      )}-preview-${sz}.jpg`;
      const r = await fetch(cdnUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          Referer: "https://www.twitch.tv/",
        },
      });

      if (r.ok) {
        type = r.headers.get("content-type") || "image/jpeg";
        buf = Buffer.from(await r.arrayBuffer());
        ok = true;
        break;
      }
    }

    if (ok) {
      res.status(200);
      res.set("Content-Type", type);
      res.set("Cache-Control", "public, max-age=3600");
      return res.send(buf);
    }

    const blank = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
      "base64"
    );
    res.set("Content-Type", "image/png");
    return res.status(200).send(blank);
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

// ---------- /api/img ----------

app.get("/api/img", async (req, res) => {
  try {
    const raw = req.query.url;
    if (!raw) {
      return res.status(400).json({ error: "Missing url" });
    }

    let urlString = raw;
    try {
      urlString = decodeURIComponent(raw);
    } catch {
      // ignore
    }

    let u;
    try {
      u = new URL(urlString);
    } catch {
      return res.status(400).json({ error: "Bad url" });
    }

    if (!ALLOWED_IMG_HOSTS.has(u.hostname)) {
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

// ---------- healthcheck ----------

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---------- SPA fallback ----------

app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
