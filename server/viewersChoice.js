/**
 * Viewers Choice — щорічне голосування глядачів за стрімерів.
 *
 * Конфіг події: server/viewers-choice/<рік>.json (категорії, стартові логіни номінантів,
 * налаштування «додай свого стрімера»).
 * Дані: Supabase (server/supabase/viewers_choice.sql) або локальні JSON-файли, якщо Supabase
 * не налаштовано (лише для розробки: на Render файли зникають при деплої).
 *
 * Змінні .env (усі необов'язкові):
 *   VC_EVENT_FILE            — інший файл конфігу (за замовчуванням 2026.json)
 *   VC_PHASE                 — перекриває phase з конфігу: soon | voting | closed | results
 *                              soon — для глядачів лише тизер «Скоро», адміни бачать усе
 *   VC_ADMIN_LOGINS          — Twitch-логіни через кому: адмінка й результати до церемонії
 *   VC_MIN_ACCOUNT_AGE_DAYS  — мінімальний вік Twitch-акаунта для голосу (за замовчуванням 14)
 *   VC_COLLECT_UK_STREAMS    — "0" вимикає автозбір українськомовних стрімів (за замовчуванням увімкнено)
 *   VC_COLLECT_MINUTES       — як часто збирати (за замовчуванням 60 хв)
 *   VC_MIN_AVG_VIEWERS       — мінімум середніх глядачів (за замовчуванням 10): менші канали,
 *                              яких додали глядачі, з'являються лише після схвалення адміном
 */
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const PHASES = new Set(["soon", "voting", "closed", "results"]);
const PROFILE_TTL = 12 * 60 * 60 * 1000;
const EVENT_TTL = 30 * 1000;
const BOARD_TTL = 30 * 1000;
const RESULTS_TTL = 30 * 1000;
const LOGIN_RE = /^[a-z0-9_]{3,25}$/;

/** «https://twitch.tv/Nick», «@Nick», «nick» → «nick» */
export function normalizeLogin(raw) {
  let s = String(raw ?? "").trim();
  const m = s.match(/twitch\.tv\/([^/?#\s]+)/i);
  if (m) s = m[1];
  s = s.replace(/^@/, "").trim().toLowerCase();
  return LOGIN_RE.test(s) ? s : "";
}

/** Обриває очікування, якщо база зависла (напр. Supabase прокидається після паузи). */
function withTimeout(promise, ms, label) {
  let t;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      t = setTimeout(() => reject(new Error(`${label}: тайм-аут ${ms} мс`)), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

/** Коротке повідомлення про помилку: Supabase на паузі віддає цілу HTML-сторінку Cloudflare. */
function shortErr(e) {
  const msg = String(e?.message || e || "");
  if (/<html|<!doctype/i.test(msg)) {
    const code = msg.match(/Error code (\d{3})/i)?.[1] || "?";
    return `Supabase недоступний (HTTP ${code}). Перевір, чи проєкт не на паузі: supabase.com/dashboard`;
  }
  return msg.split(/\r?\n/)[0].slice(0, 300);
}

export function registerViewersChoiceRoutes(app, opts) {
  const { dataDir, getSupabase, twitchClientId, twitchClientSecret } = opts;

  const eventFile = path.join(dataDir, process.env.VC_EVENT_FILE || "2026.json");
  const adminLogins = new Set(
    (process.env.VC_ADMIN_LOGINS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  /** Мінімум середніх глядачів: менші канали з автозбору не пропонуються, а додані глядачами йдуть на перевірку. */
  const minAvgViewers = Math.max(0, parseInt(String(process.env.VC_MIN_AVG_VIEWERS ?? "10"), 10) || 0);
  /** Чи є в базі нові колонки (viewers_sum, needs_review). Якщо SQL ще не виконано — працюємо без них. */
  const schema = { seenAvg: true, reviewFlag: true };
  const missingColumn = (e, col) => String(e?.message || e || "").includes(col);

  const minAccountAgeDays = Math.max(
    0,
    parseInt(String(process.env.VC_MIN_ACCOUNT_AGE_DAYS ?? "14"), 10) || 0
  );

  /* ================= конфіг події ================= */

  let eventCache = { ts: 0, data: null };

  async function loadEvent() {
    if (eventCache.data && Date.now() - eventCache.ts < EVENT_TTL) return eventCache.data;
    const raw = JSON.parse(await fs.readFile(eventFile, "utf8"));
    const w = raw.writeIns || {};
    const data = {
      eventId: String(raw.eventId || "vc"),
      title: String(raw.title || "Viewers Choice"),
      phase: PHASES.has(raw.phase) ? raw.phase : "closed",
      votingDeadline: raw.votingDeadline || null,
      writeIns: {
        enabled: w.enabled !== false,
        threshold: Math.max(1, parseInt(w.threshold ?? 3, 10) || 3),
        maxPerUserPerCategory: Math.max(1, parseInt(w.maxPerUserPerCategory ?? 3, 10) || 3),
        languages: Array.isArray(w.languages) && w.languages.length ? w.languages : ["uk"],
      },
      categories: (raw.categories || []).map((c) => ({
        id: String(c.id),
        title: String(c.title),
        description: String(c.description || ""),
        suggestGames: Array.isArray(c.suggestGames) ? c.suggestGames.map(String) : [],
        nominees: [...new Set((c.nominees || []).map(normalizeLogin).filter(Boolean))],
      })),
    };
    eventCache = { ts: Date.now(), data };
    return data;
  }

  function effectivePhase(event) {
    const forced = (process.env.VC_PHASE || "").trim();
    let phase = PHASES.has(forced) ? forced : event.phase;
    /* Після дедлайну одразу оголошуємо переможців, без проміжного етапу.
       Якщо треба притримати результати до стриму — VC_PHASE=closed. */
    if (phase === "voting" && event.votingDeadline && Date.now() > Date.parse(event.votingDeadline)) {
      phase = "results";
    }
    return phase;
  }

  /* ================= Twitch API ================= */

  let appToken = { value: "", exp: 0 };
  let appTokenPromise = null;

  async function getAppToken() {
    if (!twitchClientId || !twitchClientSecret) return "";
    if (appToken.value && Date.now() < appToken.exp) return appToken.value;
    if (!appTokenPromise) {
      appTokenPromise = (async () => {
        const r = await fetch("https://id.twitch.tv/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: twitchClientId,
            client_secret: twitchClientSecret,
            grant_type: "client_credentials",
          }),
        });
        const j = await r.json();
        if (!r.ok || !j.access_token) {
          console.error("[vc] app token", j);
          return "";
        }
        appToken = {
          value: j.access_token,
          exp: Date.now() + Math.max(60, (j.expires_in || 3600) - 300) * 1000,
        };
        return appToken.value;
      })().finally(() => {
        appTokenPromise = null;
      });
    }
    return appTokenPromise;
  }

  async function helix(pathAndQuery) {
    const token = await getAppToken();
    if (!token) return { data: [], failed: true };
    const r = await fetch(`https://api.twitch.tv/helix/${pathAndQuery}`, {
      headers: { Authorization: `Bearer ${token}`, "Client-Id": twitchClientId },
    });
    if (r.status === 401) appToken = { value: "", exp: 0 };
    if (!r.ok) {
      console.error("[vc] helix", pathAndQuery.split("?")[0], r.status, await r.text());
      return { data: [], failed: true };
    }
    return r.json();
  }

  /** login -> { ts, id, displayName, avatarUrl, exists } */
  const profileCache = new Map();
  const profileInflight = new Map();

  async function fetchProfileChunk(chunk) {
    const now = Date.now();
    try {
      const j = await helix(`users?${chunk.map((l) => `login=${encodeURIComponent(l)}`).join("&")}`);
      /* Twitch не відповів — не вважаємо канали зниклими, спробуємо наступного разу. */
      if (j.failed) return;
      const found = new Map((j.data || []).map((u) => [u.login.toLowerCase(), u]));
      for (const l of chunk) {
        const u = found.get(l);
        profileCache.set(l, {
          ts: now,
          id: u?.id || null,
          displayName: u?.display_name || l,
          avatarUrl: u?.profile_image_url || null,
          createdAt: u?.created_at || null,
          exists: !!u,
        });
      }
    } catch (e) {
      console.error("[vc] profiles", e);
    }
  }

  /** Профілі з кешем; паралельні запити на ті самі логіни чекають один виклик Twitch. */
  async function getProfiles(logins) {
    const now = Date.now();
    const waits = [];
    const missing = [];
    for (const l of logins) {
      const c = profileCache.get(l);
      if (c && now - c.ts < PROFILE_TTL) continue;
      if (profileInflight.has(l)) waits.push(profileInflight.get(l));
      else missing.push(l);
    }
    for (let i = 0; i < missing.length; i += 100) {
      const chunk = missing.slice(i, i + 100);
      const p = fetchProfileChunk(chunk).finally(() => chunk.forEach((l) => profileInflight.delete(l)));
      chunk.forEach((l) => profileInflight.set(l, p));
      waits.push(p);
    }
    await Promise.all(waits);
    const out = {};
    for (const l of logins) {
      const c = profileCache.get(l);
      out[l] = { displayName: c?.displayName || l, avatarUrl: c?.avatarUrl || null };
    }
    return out;
  }

  async function channelLanguage(userId) {
    const j = await helix(`channels?broadcaster_id=${encodeURIComponent(userId)}`);
    return j.data?.[0]?.broadcaster_language || null;
  }

  async function accountCreatedAt(session) {
    const tu = session.twitchUser;
    if (!tu) return null;
    if (tu.createdAt) return tu.createdAt;
    const j = await helix(`users?id=${encodeURIComponent(String(tu.id))}`);
    const createdAt = j.data?.[0]?.created_at || null;
    if (createdAt) tu.createdAt = createdAt;
    return createdAt;
  }

  async function accountTooYoung(session) {
    if (minAccountAgeDays <= 0) return false;
    const createdAt = await accountCreatedAt(session);
    if (!createdAt) return false;
    return (Date.now() - Date.parse(createdAt)) / 86400000 < minAccountAgeDays;
  }

  /* ================= сховище ================= */

  const fileStore = {
    file: (eventId) => path.join(dataDir, `votes-${eventId}.json`),
    seenFile: path.join(dataDir, "votes-seen-streamers.json"),
    async read(eventId) {
      try {
        const j = JSON.parse(await fs.readFile(this.file(eventId), "utf8"));
        return {
          ballots: j.ballots || {},
          nominations: j.nominations || [],
          overrides: j.overrides || {},
        };
      } catch {
        return { ballots: {}, nominations: [], overrides: {} };
      }
    },
    async write(eventId, data) {
      await fs.writeFile(this.file(eventId), JSON.stringify({ eventId, ...data }, null, 2), "utf8");
    },
  };

  const store = {
    async getBallot(eventId, uid) {
      const sb = getSupabase();
      if (sb) {
        const { data, error } = await sb
          .from("vc_ballots")
          .select("picks, updated_at")
          .eq("event_id", eventId)
          .eq("twitch_user_id", uid)
          .maybeSingle();
        if (error) throw error;
        return data ? { picks: data.picks || {}, updatedAt: data.updated_at } : null;
      }
      const d = await fileStore.read(eventId);
      return d.ballots[uid] ? { picks: d.ballots[uid].picks, updatedAt: d.ballots[uid].updatedAt } : null;
    },

    async saveBallot(eventId, uid, login, picks) {
      const updatedAt = new Date().toISOString();
      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.from("vc_ballots").upsert(
          { event_id: eventId, twitch_user_id: uid, twitch_login: login, picks, updated_at: updatedAt },
          { onConflict: "event_id,twitch_user_id" }
        );
        if (error) throw error;
      } else {
        const d = await fileStore.read(eventId);
        d.ballots[uid] = { login, picks, createdAt: d.ballots[uid]?.createdAt || updatedAt, updatedAt };
        await fileStore.write(eventId, d);
      }
      return { picks, updatedAt };
    },

    /** [{ login, picks, updatedAt }] */
    async allBallots(eventId) {
      const sb = getSupabase();
      if (sb) {
        const rows = [];
        for (let from = 0; ; from += 1000) {
          const { data, error } = await sb
            .from("vc_ballots")
            .select("twitch_login, picks, created_at, updated_at")
            .eq("event_id", eventId)
            .order("updated_at", { ascending: true })
            .range(from, from + 999);
          if (error) throw error;
          rows.push(...(data || []));
          if (!data || data.length < 1000) break;
        }
        return rows.map((r) => ({
          login: r.twitch_login || "",
          picks: r.picks || {},
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
      return Object.values((await fileStore.read(eventId)).ballots).map((b) => ({
        login: b.login || "",
        picks: b.picks || {},
        createdAt: b.createdAt || b.updatedAt,
        updatedAt: b.updatedAt,
      }));
    },

    /** [{ categoryId, login, language, by, byLogin }] */
    async listNominations(eventId) {
      const sb = getSupabase();
      if (sb) {
        const rows = [];
        const cols = "category_id, nominee_login, nominee_language, nominated_by, nominated_by_login";
        for (let from = 0; ; from += 1000) {
          let { data, error } = await sb
            .from("vc_nominations")
            .select(schema.reviewFlag ? `${cols}, needs_review` : cols)
            .eq("event_id", eventId)
            .range(from, from + 999);
          if (error && schema.reviewFlag && missingColumn(error, "needs_review")) {
            schema.reviewFlag = false;
            console.error("[vc] немає колонки needs_review — виконай server/supabase/viewers_choice.sql");
            ({ data, error } = await sb.from("vc_nominations").select(cols).eq("event_id", eventId).range(from, from + 999));
          }
          if (error) throw error;
          rows.push(...(data || []));
          if (!data || data.length < 1000) break;
        }
        return rows.map((r) => ({
          categoryId: r.category_id,
          login: r.nominee_login,
          language: r.nominee_language,
          by: r.nominated_by,
          byLogin: r.nominated_by_login,
          needsReview: !!r.needs_review,
        }));
      }
      return (await fileStore.read(eventId)).nominations;
    },

    async addNomination(eventId, n) {
      const sb = getSupabase();
      if (sb) {
        const row = {
          event_id: eventId,
          category_id: n.categoryId,
          nominee_login: n.login,
          nominee_language: n.language,
          nominated_by: n.by,
          nominated_by_login: n.byLogin,
        };
        const opts = { onConflict: "event_id,category_id,nominee_login,nominated_by", ignoreDuplicates: true };
        let { error } = await sb
          .from("vc_nominations")
          .upsert(schema.reviewFlag ? { ...row, needs_review: !!n.needsReview } : row, opts);
        if (error && schema.reviewFlag && missingColumn(error, "needs_review")) {
          schema.reviewFlag = false;
          ({ error } = await sb.from("vc_nominations").upsert(row, opts));
        }
        if (error) throw error;
        return;
      }
      const d = await fileStore.read(eventId);
      if (!d.nominations.some((x) => x.categoryId === n.categoryId && x.login === n.login && x.by === n.by)) {
        d.nominations.push(n);
        await fileStore.write(eventId, d);
      }
    },

    /** { "<categoryId>|<login>": "approved" | "hidden" } */
    async listOverrides(eventId) {
      const sb = getSupabase();
      if (sb) {
        const { data, error } = await sb
          .from("vc_nominee_overrides")
          .select("category_id, nominee_login, status")
          .eq("event_id", eventId);
        if (error) throw error;
        return Object.fromEntries((data || []).map((r) => [`${r.category_id}|${r.nominee_login}`, r.status]));
      }
      return (await fileStore.read(eventId)).overrides;
    },

    async setOverrides(eventId, items, adminLogin) {
      const sb = getSupabase();
      if (sb) {
        const clear = items.filter((i) => i.status === "clear");
        const set = items.filter((i) => i.status !== "clear");
        if (set.length) {
          const { error } = await sb.from("vc_nominee_overrides").upsert(
            set.map((i) => ({
              event_id: eventId,
              category_id: i.categoryId,
              nominee_login: i.login,
              status: i.status,
              updated_by: adminLogin,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: "event_id,category_id,nominee_login" }
          );
          if (error) throw error;
        }
        for (const i of clear) {
          const { error } = await sb
            .from("vc_nominee_overrides")
            .delete()
            .eq("event_id", eventId)
            .eq("category_id", i.categoryId)
            .eq("nominee_login", i.login);
          if (error) throw error;
        }
        return;
      }
      const d = await fileStore.read(eventId);
      for (const i of items) {
        const k = `${i.categoryId}|${i.login}`;
        if (i.status === "clear") delete d.overrides[k];
        else d.overrides[k] = i.status;
      }
      await fileStore.write(eventId, d);
    },

    async listSeen() {
      const sb = getSupabase();
      if (sb) {
        const rows = [];
        for (let from = 0; ; from += 1000) {
          const cols = "login, user_id, display_name, games, sightings, max_viewers, first_seen, last_seen";
          let { data, error } = await sb
            .from("vc_seen_streamers")
            .select(schema.seenAvg ? `${cols}, viewers_sum, viewer_samples` : cols)
            .order("sightings", { ascending: false })
            .range(from, from + 999);
          if (error && schema.seenAvg && missingColumn(error, "viewers_sum")) {
            schema.seenAvg = false;
            console.error("[vc] немає колонки viewers_sum — виконай server/supabase/viewers_choice.sql");
            ({ data, error } = await sb
              .from("vc_seen_streamers")
              .select(cols)
              .order("sightings", { ascending: false })
              .range(from, from + 999));
          }
          if (error) throw error;
          rows.push(...(data || []));
          if (!data || data.length < 1000) break;
        }
        return rows;
      }
      try {
        return Object.values(JSON.parse(await fs.readFile(fileStore.seenFile, "utf8")));
      } catch {
        return [];
      }
    },

    async mergeSeen(streams) {
      const now = new Date().toISOString();
      const byLogin = new Map();
      for (const s of streams) {
        const login = String(s.user_login || "").toLowerCase();
        if (!login) continue;
        const cur = byLogin.get(login) || {
          login,
          user_id: s.user_id,
          display_name: s.user_name,
          games: new Set(),
          viewers: 0,
        };
        if (s.game_name) cur.games.add(s.game_name);
        cur.viewers = Math.max(cur.viewers, s.viewer_count || 0);
        byLogin.set(login, cur);
      }
      if (!byLogin.size) return 0;

      const sb = getSupabase();
      let existing = new Map();
      if (sb) {
        const logins = [...byLogin.keys()];
        for (let i = 0; i < logins.length; i += 200) {
          const cols = "login, games, sightings, max_viewers, first_seen";
          let { data, error } = await sb
            .from("vc_seen_streamers")
            .select(schema.seenAvg ? `${cols}, viewers_sum, viewer_samples` : cols)
            .in("login", logins.slice(i, i + 200));
          if (error && schema.seenAvg && missingColumn(error, "viewers_sum")) {
            schema.seenAvg = false;
            ({ data, error } = await sb.from("vc_seen_streamers").select(cols).in("login", logins.slice(i, i + 200)));
          }
          if (error) throw error;
          for (const r of data || []) existing.set(r.login, r);
        }
      } else {
        existing = new Map((await this.listSeen()).map((r) => [r.login, r]));
      }

      const rows = [...byLogin.values()].map((c) => {
        const e = existing.get(c.login);
        return {
          login: c.login,
          user_id: c.user_id,
          display_name: c.display_name,
          games: [...new Set([...(e?.games || []), ...c.games])].slice(0, 30),
          sightings: (e?.sightings || 0) + 1,
          max_viewers: Math.max(e?.max_viewers || 0, c.viewers),
          first_seen: e?.first_seen || now,
          last_seen: now,
          ...(schema.seenAvg || !sb
            ? { viewers_sum: (e?.viewers_sum || 0) + c.viewers, viewer_samples: (e?.viewer_samples || 0) + 1 }
            : {}),
        };
      });

      if (sb) {
        for (let i = 0; i < rows.length; i += 500) {
          let chunk = rows.slice(i, i + 500);
          let { error } = await sb.from("vc_seen_streamers").upsert(chunk, { onConflict: "login" });
          if (error && missingColumn(error, "viewers_sum")) {
            schema.seenAvg = false;
            chunk = chunk.map(({ viewers_sum, viewer_samples, ...r }) => (void viewers_sum, void viewer_samples, r));
            ({ error } = await sb.from("vc_seen_streamers").upsert(chunk, { onConflict: "login" }));
          }
          if (error) throw error;
        }
      } else {
        for (const r of rows) existing.set(r.login, r);
        await fs.writeFile(fileStore.seenFile, JSON.stringify(Object.fromEntries(existing), null, 2), "utf8");
      }
      return rows.length;
    },
  };

  /* ================= дошка номінантів ================= */

  /**
   * Хто видимий у кожній категорії: стартовий список + додані глядачами (поріг / схвалення)
   * мінус приховані адміном. Кешується на 30 с і скидається після змін.
   */
  let boardCache = { ts: 0, eventId: "", promise: null };

  function invalidateBoard() {
    boardCache = { ts: 0, eventId: "", promise: null };
    resultsCache = { ts: 0, data: null };
  }

  async function buildBoard(event) {
    /* Якщо таблиць ще немає або база недоступна — показуємо хоча б стартовий список. */
    const [noms, overrides] = await Promise.all([
      withTimeout(store.listNominations(event.eventId), 5000, "nominations").catch((e) => {
        console.error("[vc] nominations unavailable:", shortErr(e));
        return [];
      }),
      withTimeout(store.listOverrides(event.eventId), 5000, "overrides").catch((e) => {
        console.error("[vc] overrides unavailable:", shortErr(e));
        return {};
      }),
    ]);
    const { threshold, languages } = event.writeIns;

    const categories = event.categories.map((c) => {
      const base = new Set(c.nominees);
      const writeIns = new Map(); // login -> { by:Set, language }
      for (const n of noms) {
        if (n.categoryId !== c.id) continue;
        const w = writeIns.get(n.login) || { by: new Set(), language: n.language || null, needsReview: false };
        w.by.add(String(n.by));
        if (n.language) w.language = n.language;
        if (n.needsReview) w.needsReview = true;
        writeIns.set(n.login, w);
      }
      const statusOf = (login) => overrides[`${c.id}|${login}`] || null;
      for (const key of Object.keys(overrides)) {
        const [cid, login] = key.split("|");
        if (cid === c.id && overrides[key] === "approved" && !base.has(login) && !writeIns.has(login)) {
          writeIns.set(login, { by: new Set(), language: null });
        }
      }

      const visible = [];
      const pending = [];
      for (const login of base) {
        if (statusOf(login) !== "hidden") visible.push({ login, source: "list" });
      }
      for (const [login, w] of writeIns) {
        if (base.has(login)) continue;
        const st = statusOf(login);
        if (st === "hidden") continue;
        const langOk = !w.language || languages.includes(w.language);
        const entry = {
          login,
          source: "viewers",
          count: w.by.size,
          language: w.language,
          needsReview: !!w.needsReview,
          by: w.by,
        };
        if (st === "approved" || (langOk && !w.needsReview && w.by.size >= threshold)) visible.push(entry);
        else pending.push(entry);
      }
      const hidden = new Set(
        Object.keys(overrides)
          .filter((k) => k.startsWith(`${c.id}|`) && overrides[k] === "hidden")
          .map((k) => k.slice(c.id.length + 1))
      );
      return { id: c.id, title: c.title, description: c.description, visible, pending, hidden, writeIns, statusOf };
    });

    const allLogins = [
      ...new Set(categories.flatMap((c) => [...c.visible, ...c.pending].map((n) => n.login))),
    ];
    const profiles = await getProfiles(allLogins);

    /* Канали, яких Twitch точно не знає (змінили нік, видалили, бан), прибираємо з голосування
       й показуємо адміну, щоб він міг оновити нік у конфігу. */
    const gone = (login) => profileCache.get(login)?.exists === false;
    for (const c of categories) {
      c.missing = [...c.visible, ...c.pending].filter((n) => gone(n.login)).map((n) => n.login);
      c.visible = c.visible.filter((n) => !gone(n.login));
      c.pending = c.pending.filter((n) => !gone(n.login));
    }
    return { categories, profiles, overrides };
  }

  async function getBoard(event) {
    const fresh = boardCache.eventId === event.eventId && Date.now() - boardCache.ts < BOARD_TTL;
    if (!fresh || !boardCache.promise) {
      const promise = buildBoard(event).catch((e) => {
        invalidateBoard();
        throw e;
      });
      boardCache = { ts: Date.now(), eventId: event.eventId, promise };
    }
    return boardCache.promise;
  }

  /** Логіни, за які цей користувач може голосувати в категорії. */
  function allowedFor(boardCat, uid) {
    const set = new Set(boardCat.visible.map((n) => n.login));
    if (uid) for (const p of boardCat.pending) if (p.by.has(uid)) set.add(p.login);
    return set;
  }

  /* ================= маршрути: публічні ================= */

  const isAdmin = (session) =>
    !!session?.twitchUser && adminLogins.has(String(session.twitchUser.login || "").toLowerCase());

  const userKey = (req) =>
    req.session?.twitchUser?.id ? `tw:${req.session.twitchUser.id}` : ipKeyGenerator(req.ip || "");

  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    keyGenerator: userKey,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Забагато спроб. Спробуй трохи пізніше." },
  });

  /** Легкий запит для шапки й головної: чи показувати посилання на Viewers Choice. */
  app.get("/api/vc/status", async (req, res) => {
    try {
      const event = await loadEvent();
      res.set("Cache-Control", "private, no-store");
      res.json({ success: true, phase: effectivePhase(event), isAdmin: isAdmin(req.session) });
    } catch (e) {
      console.error("[vc] status:", shortErr(e));
      res.json({ success: false, phase: "soon", isAdmin: false });
    }
  });

  app.get("/api/vc/event", async (req, res) => {
    try {
      const event = await loadEvent();
      const phase = effectivePhase(event);

      /* «Скоро»: глядачам не показуємо ні номінантів, ні категорій. Адміни бачать усе (прев'ю). */
      if (phase === "soon" && !isAdmin(req.session)) {
        res.set("Cache-Control", "private, no-store");
        return res.json({
          success: true,
          event: { id: event.eventId, title: event.title, phase, votingDeadline: null, minAccountAgeDays, writeIns: { enabled: false } },
          categories: [],
          me: { loggedIn: !!req.session?.twitchUser, isAdmin: false, ballot: null },
        });
      }

      const board = await getBoard(event);
      const tu = req.session?.twitchUser;
      const uid = tu ? String(tu.id) : "";

      let ballot = null;
      if (uid) {
        try {
          ballot = await withTimeout(store.getBallot(event.eventId, uid), 5000, "ballot");
        } catch (e) {
          console.error("[vc] read ballot:", shortErr(e));
        }
      }

      const card = (n, extra = {}) => ({
        login: n.login,
        ...board.profiles[n.login],
        ...(n.source === "viewers" ? { addedByViewers: true } : {}),
        ...extra,
      });

      res.set("Cache-Control", "private, no-store");
      res.json({
        success: true,
        event: {
          id: event.eventId,
          title: event.title,
          phase,
          votingDeadline: event.votingDeadline,
          minAccountAgeDays,
          writeIns: {
            enabled: event.writeIns.enabled,
            threshold: event.writeIns.threshold,
            maxPerUserPerCategory: event.writeIns.maxPerUserPerCategory,
            minAvgViewers,
          },
        },
        categories: board.categories.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          nominees: [
            ...c.visible.map((n) => card(n)),
            ...(uid
              ? c.pending.filter((p) => p.by.has(uid)).map((p) => card(p, { onlyMe: true, count: p.count }))
              : []),
          ],
        })),
        me: { loggedIn: !!tu, isAdmin: isAdmin(req.session), ballot },
      });
    } catch (e) {
      console.error("[vc] event:", shortErr(e));
      res.status(500).json({ success: false, error: "Не вдалося завантажити голосування" });
    }
  });

  app.post("/api/vc/ballot", writeLimiter, async (req, res) => {
    try {
      const tu = req.session?.twitchUser;
      if (!tu) return res.status(401).json({ success: false, error: "Увійди через Twitch, щоб голосувати" });
      const event = await loadEvent();
      if (effectivePhase(event) !== "voting") {
        return res.status(403).json({ success: false, error: "Голосування зараз закрите" });
      }
      if (await accountTooYoung(req.session)) {
        return res.status(403).json({
          success: false,
          error: `Голосувати можуть акаунти Twitch, старші за ${minAccountAgeDays} днів`,
        });
      }
      const raw = req.body?.picks;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return res.status(400).json({ success: false, error: "Некоректний вибір" });
      }
      const uid = String(tu.id);
      const board = await getBoard(event);
      const picks = {};
      for (const c of board.categories) {
        const v = raw[c.id];
        if (v == null || v === "") continue;
        const login = normalizeLogin(v);
        if (!login || !allowedFor(c, uid).has(login)) {
          return res.status(400).json({
            success: false,
            error: `Номінанта «${String(v).slice(0, 40)}» немає в категорії «${c.title}»`,
          });
        }
        picks[c.id] = login;
      }
      if (!Object.keys(picks).length) {
        return res.status(400).json({ success: false, error: "Обери хоча б одного номінанта" });
      }
      const saved = await store.saveBallot(event.eventId, uid, String(tu.login || "").slice(0, 128), picks);
      resultsCache = { ts: 0, data: null };
      res.json({ success: true, ballot: saved });
    } catch (e) {
      console.error("[vc] ballot:", shortErr(e));
      res.status(500).json({ success: false, error: "Не вдалося зберегти голос" });
    }
  });

  /** «Немає твого стрімера? Додай» */
  app.post("/api/vc/nominate", writeLimiter, async (req, res) => {
    try {
      const tu = req.session?.twitchUser;
      if (!tu) return res.status(401).json({ success: false, error: "Увійди через Twitch, щоб додати стрімера" });
      const event = await loadEvent();
      if (effectivePhase(event) !== "voting" || !event.writeIns.enabled) {
        return res.status(403).json({ success: false, error: "Зараз додавати стрімерів не можна" });
      }
      if (await accountTooYoung(req.session)) {
        return res.status(403).json({
          success: false,
          error: `Додавати можуть акаунти Twitch, старші за ${minAccountAgeDays} днів`,
        });
      }
      const login = normalizeLogin(req.body?.login);
      if (!login) return res.status(400).json({ success: false, error: "Введи нік або посилання на канал Twitch" });

      const uid = String(tu.id);
      const board = await getBoard(event);
      const cat = board.categories.find((c) => c.id === String(req.body?.categoryId || ""));
      if (!cat) return res.status(400).json({ success: false, error: "Невідома категорія" });

      const nominee = () => ({ login, ...board.profiles[login] });
      if (cat.hidden.has(login)) {
        return res.status(403).json({ success: false, error: "Цього стрімера прибрано з категорії модератором" });
      }
      if (cat.visible.some((n) => n.login === login)) {
        return res.json({ success: true, status: "exists", nominee: nominee() });
      }
      const mine = [...cat.writeIns.values()].filter((w) => w.by.has(uid)).length;
      const already = cat.writeIns.get(login)?.by.has(uid);
      if (!already && mine >= event.writeIns.maxPerUserPerCategory) {
        return res.status(400).json({
          success: false,
          error: `У цій категорії можна додати до ${event.writeIns.maxPerUserPerCategory} стрімерів`,
        });
      }

      await getProfiles([login]);
      const prof = profileCache.get(login);
      if (!prof?.exists) {
        return res.status(404).json({ success: false, error: `Каналу «${login}» на Twitch не знайдено` });
      }
      const language = (await channelLanguage(prof.id)) || null;
      const avg = await seenAverage(login);
      const small = minAvgViewers > 0 && (avg === null || avg < minAvgViewers);

      await store.addNomination(event.eventId, {
        categoryId: cat.id,
        login,
        language,
        needsReview: small,
        by: uid,
        byLogin: String(tu.login || "").slice(0, 128),
      });
      invalidateBoard();

      const fresh = await getBoard(event);
      const fc = fresh.categories.find((c) => c.id === cat.id);
      const isVisible = fc.visible.some((n) => n.login === login);
      const count = fc.writeIns.get(login)?.by.size || 1;
      const langOk = !language || event.writeIns.languages.includes(language);
      res.json({
        success: true,
        status: isVisible ? "visible" : !langOk || small ? "review" : "needs_more",
        reason: !langOk ? "language" : small ? "small" : null,
        avgViewers: avg,
        count,
        threshold: event.writeIns.threshold,
        nominee: { login, displayName: prof.displayName, avatarUrl: prof.avatarUrl },
      });
    } catch (e) {
      console.error("[vc] nominate:", shortErr(e));
      res.status(500).json({ success: false, error: "Не вдалося додати стрімера" });
    }
  });

  let resultsCache = { ts: 0, data: null };

  /** Повний підрахунок: усі номінанти з голосами, місця (однакова кількість голосів — однакове місце). */
  async function computeResults(event) {
    if (resultsCache.data && Date.now() - resultsCache.ts < RESULTS_TTL) return resultsCache.data;
    const [rows, board] = await Promise.all([store.allBallots(event.eventId), getBoard(event)]);
    const ballots = rows.map((r) => r.picks);
    const extra = [...new Set(ballots.flatMap((b) => Object.values(b)))];
    const profiles = { ...board.profiles, ...(await getProfiles(extra)) };

    const categories = board.categories.map((c) => {
      const tally = new Map();
      let total = 0;
      for (const b of ballots) {
        const l = b[c.id];
        if (!l || c.hidden.has(l)) continue;
        tally.set(l, (tally.get(l) || 0) + 1);
        total++;
      }
      let place = 0;
      let prevVotes = -1;
      const ranking = [...tally.entries()]
        .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
        .map(([login, votes], i) => {
          if (votes !== prevVotes) place = i + 1;
          prevVotes = votes;
          return {
            place,
            login,
            ...profiles[login],
            votes,
            pct: total ? Math.round((votes / total) * 1000) / 10 : 0,
          };
        });
      const margin = ranking.length > 1 ? ranking[0].votes - ranking[1].votes : ranking[0]?.votes || 0;
      return {
        id: c.id,
        title: c.title,
        totalVotes: total,
        participationPct: ballots.length ? Math.round((total / ballots.length) * 1000) / 10 : 0,
        nomineesWithVotes: ranking.length,
        margin,
        ranking,
      };
    });

    const totalVotes = categories.reduce((n, c) => n + c.totalVotes, 0);
    const byVotes = [...categories].sort((x, y) => y.totalVotes - x.totalVotes);
    const contested = categories
      .filter((c) => c.ranking.length > 1)
      .sort((x, y) => x.margin - y.margin || y.totalVotes - x.totalVotes)[0];
    const data = {
      totalBallots: ballots.length,
      totalVotes,
      avgPicksPerBallot: ballots.length ? Math.round((totalVotes / ballots.length) * 10) / 10 : 0,
      mostPopularCategory: byVotes[0]?.totalVotes
        ? { id: byVotes[0].id, title: byVotes[0].title, votes: byVotes[0].totalVotes }
        : null,
      closestRace: contested ? { id: contested.id, title: contested.title, margin: contested.margin } : null,
      categories,
    };
    resultsCache = { ts: Date.now(), data };
    return data;
  }

  app.get("/api/vc/results", async (req, res) => {
    try {
      const event = await loadEvent();
      const phase = effectivePhase(event);
      const admin = isAdmin(req.session);
      if (phase !== "results" && !admin) {
        return res.status(403).json({
          success: false,
          hidden: true,
          error: "Результати оголосимо після церемонії на стримі",
        });
      }
      const data = await computeResults(event);
      res.set("Cache-Control", "private, no-store");
      res.json({ success: true, phase, preview: phase !== "results", isAdmin: admin, ...data });
    } catch (e) {
      console.error("[vc] results:", shortErr(e));
      res.status(500).json({ success: false, error: "Не вдалося порахувати результати" });
    }
  });

  /** CSV для Excel / Google Таблиць (з BOM, щоб кирилиця відкрилась коректно). */
  function sendCsv(res, filename, header, rows) {
    const esc = (v) => {
      const t = String(v ?? "");
      return /[",;\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const body = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="${filename}"`);
    res.set("Cache-Control", "no-store");
    res.send("﻿" + body);
  }

  /* ================= маршрути: адмін ================= */

  function requireAdmin(req, res, next) {
    if (!req.session?.twitchUser) return res.status(401).json({ success: false, error: "Увійди через Twitch" });
    if (!isAdmin(req.session)) return res.status(403).json({ success: false, error: "Немає доступу" });
    next();
  }

  app.get("/api/vc/admin/overview", requireAdmin, async (req, res) => {
    try {
      const event = await loadEvent();
      invalidateBoard();
      const board = await getBoard(event);
      const row = (c, n, visible) => ({
        login: n.login,
        ...board.profiles[n.login],
        source: n.source,
        count: n.count || 0,
        language: n.language || null,
        needsReview: !!n.needsReview,
        status: c.statusOf(n.login),
        visible,
      });
      res.json({
        success: true,
        threshold: event.writeIns.threshold,
        languages: event.writeIns.languages,
        categories: board.categories.map((c) => ({
          id: c.id,
          title: c.title,
          listCount: c.visible.filter((n) => n.source === "list").length,
          writeIns: [
            ...c.pending.map((n) => row(c, n, false)),
            ...c.visible.filter((n) => n.source === "viewers").map((n) => row(c, n, true)),
          ].sort((a, b) => Number(a.visible) - Number(b.visible) || b.count - a.count),
          hidden: [...c.hidden].map((login) => ({ login, ...(board.profiles[login] || { displayName: login }) })),
          missingOnTwitch: c.missing || [],
        })),
      });
    } catch (e) {
      console.error("[vc] admin overview:", shortErr(e));
      res.status(500).json({ success: false, error: "Помилка сервера" });
    }
  });

  app.post("/api/vc/admin/override", requireAdmin, async (req, res) => {
    try {
      const event = await loadEvent();
      const categoryId = String(req.body?.categoryId || "");
      if (!event.categories.some((c) => c.id === categoryId)) {
        return res.status(400).json({ success: false, error: "Невідома категорія" });
      }
      const status = String(req.body?.status || "");
      if (!["approved", "hidden", "clear"].includes(status)) {
        return res.status(400).json({ success: false, error: "Некоректний статус" });
      }
      const list = Array.isArray(req.body?.logins) ? req.body.logins : [req.body?.login];
      const logins = [...new Set(list.map(normalizeLogin).filter(Boolean))].slice(0, 500);
      if (!logins.length) return res.status(400).json({ success: false, error: "Немає логінів" });
      await store.setOverrides(
        event.eventId,
        logins.map((login) => ({ categoryId, login, status })),
        String(req.session.twitchUser.login || "")
      );
      invalidateBoard();
      res.json({ success: true, updated: logins.length });
    } catch (e) {
      console.error("[vc] admin override:", shortErr(e));
      res.status(500).json({ success: false, error: "Не вдалося зберегти" });
    }
  });

  app.get("/api/vc/admin/seen", requireAdmin, async (req, res) => {
    try {
      const event = await loadEvent();
      const [seen, board] = await Promise.all([store.listSeen(), getBoard(event)]);
      const inCats = new Map();
      for (const c of board.categories) {
        for (const n of c.visible) {
          if (!inCats.has(n.login)) inCats.set(n.login, []);
          inCats.get(n.login).push(c.id);
        }
      }
      res.json({
        success: true,
        minAvgViewers,
        hasAverages: schema.seenAvg,
        collector: {
          enabled: collectorEnabled,
          everyMinutes: collectorMinutes,
          lastRun: collectorState.lastRun,
          lastCount: collectorState.lastCount,
        },
        categories: event.categories.map((c) => ({ id: c.id, title: c.title, suggestGames: c.suggestGames })),
        streamers: seen.map((s) => ({
          login: s.login,
          displayName: s.display_name || s.login,
          avatarUrl: profileCache.get(s.login)?.avatarUrl || null,
          games: s.games || [],
          sightings: s.sightings || 0,
          maxViewers: s.max_viewers || 0,
          avgViewers: avgOf(s),
          lastSeen: s.last_seen,
          inCategories: inCats.get(s.login) || [],
        })),
      });
    } catch (e) {
      console.error("[vc] admin seen:", shortErr(e));
      res.status(500).json({ success: false, error: "Помилка сервера" });
    }
  });

  /** Живий лічильник для адмінки: скільки людей проголосувало й коли. */
  app.get("/api/vc/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const event = await loadEvent();
      const rows = await store.allBallots(event.eventId);
      const now = Date.now();
      const HOUR = 3600 * 1000;
      const hourly = Array.from({ length: 24 }, () => 0);
      let lastHour = 0;
      let last24h = 0;
      let changed = 0;
      const perCategory = Object.fromEntries(event.categories.map((c) => [c.id, 0]));
      for (const r of rows) {
        const t = Date.parse(r.createdAt || r.updatedAt || "");
        if (!Number.isNaN(t)) {
          const ago = now - t;
          if (ago < HOUR) lastHour++;
          if (ago < 24 * HOUR) {
            last24h++;
            hourly[23 - Math.floor(ago / HOUR)]++;
          }
        }
        if (r.createdAt && r.updatedAt && r.updatedAt !== r.createdAt) changed++;
        for (const id of Object.keys(r.picks || {})) if (id in perCategory) perCategory[id]++;
      }
      res.set("Cache-Control", "no-store");
      res.json({
        success: true,
        phase: effectivePhase(event),
        totalBallots: rows.length,
        lastHour,
        last24h,
        changedBallots: changed,
        hourly,
        perCategory: event.categories.map((c) => ({ id: c.id, title: c.title, votes: perCategory[c.id] })),
      });
    } catch (e) {
      console.error("[vc] admin stats:", shortErr(e));
      res.status(500).json({ success: false, error: "Не вдалося порахувати" });
    }
  });

  /** Підсумки: категорія, місце, стрімер, голоси, відсоток. */
  app.get("/api/vc/admin/export/results.csv", requireAdmin, async (_req, res) => {
    try {
      const event = await loadEvent();
      resultsCache = { ts: 0, data: null };
      const data = await computeResults(event);
      const rows = data.categories.flatMap((c) =>
        c.ranking.map((r) => [c.title, r.place, r.displayName || r.login, r.login, r.votes, String(r.pct).replace(".", ","), c.totalVotes])
      );
      sendCsv(
        res,
        `${event.eventId}-results.csv`,
        ["Категорія", "Місце", "Стрімер", "Логін", "Голосів", "Відсоток", "Усього голосів у категорії"],
        rows
      );
    } catch (e) {
      console.error("[vc] export results:", shortErr(e));
      res.status(500).json({ success: false, error: "Не вдалося сформувати CSV" });
    }
  });

  /** Усі бюлетені: хто (логін Twitch) за кого проголосував у кожній категорії. */
  app.get("/api/vc/admin/export/ballots.csv", requireAdmin, async (_req, res) => {
    try {
      const event = await loadEvent();
      const rows = await store.allBallots(event.eventId);
      sendCsv(
        res,
        `${event.eventId}-ballots.csv`,
        ["Глядач", "Оновлено", ...event.categories.map((c) => c.title)],
        rows.map((r) => [r.login, r.updatedAt || "", ...event.categories.map((c) => r.picks[c.id] || "")])
      );
    } catch (e) {
      console.error("[vc] export ballots:", shortErr(e));
      res.status(500).json({ success: false, error: "Не вдалося сформувати CSV" });
    }
  });

  app.post("/api/vc/admin/collect-now", requireAdmin, async (_req, res) => {
    const n = await collectUkStreams();
    res.json({ success: true, collected: n });
  });

  /* ================= автозбір українськомовних стрімів ================= */

  const collectorEnabled =
    process.env.VC_COLLECT_UK_STREAMS !== "0" && !!twitchClientId && !!twitchClientSecret;
  const collectorState = { running: false, lastRun: null, lastCount: 0 };
  const collectorMinutes = Math.max(5, parseInt(process.env.VC_COLLECT_MINUTES || "60", 10) || 60);

  /** Середні глядачі каналу з автозбору; якщо середніх ще немає — максимум; немає в базі — null. */
  function avgOf(s) {
    if (!s) return null;
    if (s.viewer_samples > 0) return Math.round(s.viewers_sum / s.viewer_samples);
    return s.max_viewers ?? null;
  }
  async function seenAverage(login) {
    try {
      const sb = getSupabase();
      if (sb) {
        const cols = schema.seenAvg ? "max_viewers, viewers_sum, viewer_samples" : "max_viewers";
        const { data, error } = await sb.from("vc_seen_streamers").select(cols).eq("login", login).maybeSingle();
        if (error) throw error;
        return avgOf(data);
      }
      return avgOf((await store.listSeen()).find((r) => r.login === login));
    } catch (e) {
      console.error("[vc] seen average:", shortErr(e));
      return null;
    }
  }

  async function collectUkStreams() {
    if (!collectorEnabled || collectorState.running) return 0;
    collectorState.running = true;
    try {
      const streams = [];
      let cursor = "";
      for (let page = 0; page < 30; page++) {
        const j = await helix(`streams?language=uk&first=100${cursor ? `&after=${encodeURIComponent(cursor)}` : ""}`);
        streams.push(...(j.data || []));
        cursor = j.pagination?.cursor || "";
        if (!cursor || !(j.data || []).length) break;
      }
      const n = await store.mergeSeen(streams);
      collectorState.lastRun = new Date().toISOString();
      collectorState.lastCount = n;
      return n;
    } catch (e) {
      console.error("[vc] collector:", shortErr(e));
      return 0;
    } finally {
      collectorState.running = false;
    }
  }

  if (collectorEnabled) {
    setTimeout(() => void collectUkStreams(), 15 * 1000).unref?.();
    setInterval(() => void collectUkStreams(), collectorMinutes * 60 * 1000).unref?.();
  }

  /* Прогрів кешу: аватарки номінантів завантажуються один раз при старті, а не під першим натовпом. */
  setTimeout(async () => {
    try {
      await getBoard(await loadEvent());
    } catch (e) {
      console.error("[vc] warmup:", shortErr(e));
    }
  }, 2000).unref?.();
}
