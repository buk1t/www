// js/pages/status.js
import { CONFIG } from "../core/config.js";
import { fetchJSON } from "../core/fetch.js";
import { el, clear, safeExternalLink } from "../core/render.js";

const DOMAIN = "buk1t.com";
const ISSUE_EMAIL = "dev@buk1t.com";

const WARN_MS = 900;
const TIMEOUT_MS = 5000;

// Fallback must not depend on api
const FALLBACK_SERVICES = [
  { id: "www", name: "www", url: `https://www.${DOMAIN}/` },
  { id: "labs", name: "labs", url: `https://labs.${DOMAIN}/` },
  { id: "search", name: "search", url: `https://search.${DOMAIN}/` },
  { id: "api", name: "api", url: `https://api.${DOMAIN}/` }
];

const $ = (id) => document.getElementById(id);

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function buildUrlLine(url, subtitle) {
  const d = el("div", { class: "status-url" });

  if (subtitle) {
    d.textContent = subtitle;
    return d;
  }

  try {
    const u = new URL(url);
    const host = u.host;
    const path = (u.pathname || "/") + (u.search || "") + (u.hash || "");

    const parts = host.split(".");
    const first = parts[0] || host;
    const rest = parts.slice(1).join(".");

    const strong = el("span", { class: "subdomain", text: first });
    const tail = el("span", { text: (rest ? "." + rest : "") + (path === "/" ? "" : path) });

    d.appendChild(strong);
    d.appendChild(tail);
    return d;
  } catch {
    d.textContent = String(url).replace(/^https?:\/\//, "");
    return d;
  }
}

function pill(status, text, href) {
  const dot = el("span", { class: `dot ${status}` });
  const content = href
    ? el("a", { href, text })
    : el("span", { text });

  const wrap = el("span", { class: "pill-chip" }, [dot, content]);

  if (href) {
    try {
      const u = new URL(href, location.origin);
      if (u.origin !== location.origin) safeExternalLink(content);
    } catch {}
  }

  return wrap;
}

function makeCard(target) {
  // one service = one card
  const card = el("div", { class: "card span-6 status-card" }, [
    el("div", { class: "card-top" }, [
      el("h3", { class: "card-title", text: target.name || target.id || "service" }),
      el("span", { class: "badge", text: "checking…" })
    ]),
    target.hideUrl
      ? buildUrlLine("", target.subtitle || "")
      : buildUrlLine(target.url),
    el("div", { class: "pills" }, [pill("checking", "checking…")])
  ]);

  const badge = card.querySelector(".badge");
  const pillsBox = card.querySelector(".pills");

  return { card, badge, pillsBox };
}

async function ping(url) {
  const controller = new AbortController();
  const start = performance.now();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const u = new URL(url);
    u.searchParams.set("_status", String(Date.now()));

    // no-cors means "opaque" but still fails on network errors/timeouts.
    await fetch(u.toString(), {
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timer);
    return { ok: true, ms: Math.round(performance.now() - start) };
  } catch {
    clearTimeout(timer);
    return { ok: false, ms: Math.round(performance.now() - start) };
  }
}

function makeWildcardTarget() {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const sub = `__status-${stamp}-${rand}`;
  return {
    id: "wildcard",
    name: "catch-all routing",
    url: `https://${sub}.${DOMAIN}/`,
    hideUrl: true,
    subtitle: `${sub}.${DOMAIN}`
  };
}

function setupReportButton(extraContext = "") {
  const btn = $("reportBtn");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const now = new Date();
    const subject = `buk1t issue report (${now.toLocaleString()})`;

    const body = [
      "Describe what happened:",
      "",
      "Which URL?",
      "",
      "What did you expect?",
      "",
      "What actually happened?",
      "",
      "—",
      `Time: ${now.toISOString()}`,
      `Status page: ${location.href}`,
      extraContext ? `Context: ${extraContext}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    location.href =
      `mailto:${ISSUE_EMAIL}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
  });
}

function summarize(up, slow, down) {
  if (down === 0 && slow === 0) return `All good — ${up} up.`;
  return `${up} up • ${slow} slow • ${down} down`;
}

function setFooterLinksFromBuk1t(buk1t) {
  const box = $("footer-links");
  if (!box) return;

  const links = Array.isArray(buk1t?.links) ? buk1t.links : [];
  if (!links.length) return;

  box.innerHTML = "";
  links.forEach((l, i) => {
    const a = document.createElement("a");
    a.href = l.href;
    a.textContent = l.name;
    try {
      const u = new URL(l.href, location.origin);
      if (u.origin !== location.origin) safeExternalLink(a);
    } catch {}
    box.appendChild(a);
    if (i < links.length - 1) box.appendChild(document.createTextNode(" · "));
  });
}

async function loadTargets() {
  // Try buk1t.json first
  try {
    const buk1t = await fetchJSON(CONFIG.BUK1T_JSON_URL);
    setFooterLinksFromBuk1t(buk1t);

    const svcs = Array.isArray(buk1t?.services) ? buk1t.services : [];
    const targets = svcs
      .map((s) => ({
        id: s.id || s.subdomain || s.name,
        name: s.name || s.id,
        // prefer check_url, fall back to base_url
        url: s.check_url || s.base_url
      }))
      .filter((t) => t.url);

    // ensure core ones exist even if missing
    const merged = uniqBy(
      [...targets, ...FALLBACK_SERVICES],
      (t) => t.url
    );

    // wildcard last
    merged.push(makeWildcardTarget());
    return merged;
  } catch (e) {
    const n = $("notice");
    if (n) {
      n.style.display = "block";
      n.textContent = `Couldn’t load buk1t.json (${String(e.message || e)}). Using fallback targets.`;
    }

    const merged = [...FALLBACK_SERVICES, makeWildcardTarget()];
    return merged;
  }
}

(async function main() {
  const subtitleEl = $("subtitle");
  const metaEl = $("meta");
  const summaryEl = $("summary");
  const checksEl = $("checks");

  if (subtitleEl) {
    subtitleEl.textContent = navigator.onLine
      ? "Checking services…"
      : "You appear to be offline.";
  }

  const targets = await loadTargets();

  clear(checksEl);
  const cards = targets.map((t) => ({ t, ui: makeCard(t) }));
  cards.forEach(({ ui }) => checksEl.appendChild(ui.card));

  const results = await Promise.all(
    cards.map(async (c) => ({ c, r: await ping(c.t.url) }))
  );

  let up = 0, slow = 0, down = 0;

  for (const { c, r } of results) {
    clear(c.ui.pillsBox);

    if (r.ok) {
      if (r.ms >= WARN_MS) {
        slow++;
        c.ui.badge.textContent = "slow";
        c.ui.pillsBox.appendChild(pill("slow", `slow • ${r.ms}ms`, c.t.url));
      } else {
        up++;
        c.ui.badge.textContent = "up";
        c.ui.pillsBox.appendChild(pill("up", `up • ${r.ms}ms`, c.t.url));
      }
    } else {
      down++;
      c.ui.badge.textContent = "down";
      c.ui.pillsBox.appendChild(pill("down", "down • unreachable", c.t.url));
    }
  }

  const sum = summarize(up, slow, down);
  if (summaryEl) summaryEl.textContent = sum;

  if (subtitleEl) subtitleEl.textContent = sum;

  const checkedAt = new Date();
  if (metaEl) metaEl.textContent = `checked: ${checkedAt.toLocaleString()}`;

  setupReportButton(sum);
})();