import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors({ origin: "https://vamoos-clips.onrender.com" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../dist")));

const clipsCache = { ts: 0, data: null };
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
  "static-cdn.jtvnw.net",
  "twitchcdn.net",
  "clips.twitch.tv",
]);

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
      .map((cols, i) => {
        const clipUrl = (cols[idx.url] ?? "").trim();
        if (!clipUrl) return null;
        const createdAt = idx.ts >= 0 ? (cols[idx.ts] ?? "").trim() : "";
        const title =
          (idx.title >= 0 ? (cols[idx.title] ?? "").trim() : "") || "Без назви";
        const author =
          (idx.author >= 0 ? (cols[idx.author] ?? "").trim() : "") ||
          "Невідомо";
        const note = idx.note >= 0 ? (cols[idx.note] ?? "").trim() : "";

        return {
          clipUrl,
          title: (cols[idx.title] ?? "").trim() || "Без назви",
          author: (cols[idx.author] ?? "").trim() || "Невідомо",
          note: (cols[idx.note] ?? "").trim(),
          createdAt: cols[idx.ts] ?? null,
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
async function fetchBestThumb(clipUrl) {
  if (!isValidHttpUrl(clipUrl)) return null; // ⬅️ важливо
  const url = normalizeClipUrl(clipUrl);

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

  let m = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  );
  if (m && m[1] && !isBadThumb(m[1])) return m[1];

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
    } catch {}
  }

  m = html.match(/https?:\/\/[^"' ]+?-preview-(480x272|260x147|86x45)\.jpg/);
  if (m && m[0] && !isBadThumb(m[0])) return m[0];

  m = html.match(/"thumbnail(?:_?url|URL)"\s*:\s*"([^"]+?)"/i);
  if (m && m[1] && !isBadThumb(m[1])) return m[1];

  return null;
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
    } catch {}

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

app.get("/api/clip-thumb", async (req, res) => {
  try {
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const sizes = ["480x272", "260x147", "86x45"];
    let ok = false,
      buf = null,
      type = "image/jpeg",
      status = 200;

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
app.get("/api/img", async (req, res) => {
  try {
    const raw = req.query.url;
    if (!raw) return res.status(400).json({ error: "Missing url" });
    const u = new URL(raw);

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
app.get("/api/health", (_req, res) => res.json({ ok: true }));

function normalizeClipUrl(raw) {
  try {
    if (!isValidHttpUrl(raw)) return null;
    const u = new URL(raw);
    const p = u.pathname.split("/").filter(Boolean);
    const i = p.findIndex((x) => x.toLowerCase() === "clip");
    if (i >= 0 && p[i + 1]) return `https://clips.twitch.tv/${p[i + 1]}`;
    if (u.hostname.includes("clips.twitch.tv")) return raw;
  } catch {}
  return null;
}
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
