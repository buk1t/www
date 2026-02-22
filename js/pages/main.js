// js/pages/main.js
import { CONFIG } from "../core/config.js";
import { fetchJSON } from "../core/fetch.js";
import { $, el, clear, safeExternalLink } from "../core/render.js";

const FALLBACK = {
  meta: { updated: null, title: "buk1t", tagline: "a personal internet system" },

  identity: {
    title: "What is Buk1t?",
    headline: "A personal internet system",
    body: "Buk1t is a collection of small, fast pages that (hopefully) do useful things. I built it to feel cohesive, cool, and a little bit futuristic."
  },

  philosophy: {
    title: "Design rule",
    body: "Less is more. Every page should be simple, focused, and intentional. If something feels heavy, it probably is."
  },

  // top tiles
  featured: [
    {
      title: "Search",
      desc: "Fast routing across buk1t. Ships separately as a real app.",
      href: "https://search.buk1t.com",
      status: "active",
      tags: ["app", "core"]
    },
    {
      title: "Soundscapes",
      desc: "Ambient background for studying — currently in Labs.",
      href: "https://labs.buk1t.com/soundscapes/",
      status: "active",
      tags: ["labs", "audio"]
    }
  ],

  // what's new (keep this short)
  now: [
    {
      title: "Reorganizing buk1t",
      desc: "Reducing subdomains, simplifying styles, and making api the single source of truth.",
      href: "/apps/",
      status: "in progress",
      tags: ["infra", "cleanup", "json"]
    }
  ],

  // coming next
  future: [
    {
      title: "iPhone custom start page",
      desc: "A clean, touch-first start page built for mobile.",
      href: "/apps/",
      status: "planned",
      tags: ["mobile", "ui"]
    },
    {
      title: "Family tree maker",
      desc: "A simple tool for building and exporting family trees.",
      href: "/apps/",
      status: "planned",
      tags: ["tool", "data"]
    }
  ],

  links: [
    { name: "Apps", href: "/apps/" },
    { name: "GitHub", href: "https://github.com/buk1t" },
    { name: "Email", href: "mailto:dev@buk1t.com" }
  ],

  cta: {
    primary: { label: "Open Search", href: "https://search.buk1t.com" },
    secondary: { label: "Browse Apps", href: "/apps/" }
  }
};

function card(item, { feature = false } = {}) {
  const a = el("a", { class: `card span-6${feature ? " feature" : ""}`, href: item.href }, [
    el("div", { class: "card-top" }, [
      el("h3", { class: "card-title", text: item.title || "Untitled" }),
      item.status ? el("span", { class: "badge", text: String(item.status) }) : null
    ]),
    item.desc ? el("p", { class: "card-desc", text: item.desc }) : null,
    Array.isArray(item.tags) && item.tags.length
      ? el("div", { class: "tags" }, item.tags.slice(0, 6).map(t => el("span", { class: "tag", text: t })))
      : null
  ]);

  // external -> new tab
  try {
    const u = new URL(item.href, location.origin);
    if (u.origin !== location.origin) safeExternalLink(a);
  } catch {}

  return a;
}

function setFooterLinks(data) {
  const box = $("#footer-links");
  if (!box) return;
  clear(box);

  const links = (data.links && Array.isArray(data.links)) ? data.links : FALLBACK.links;

  links.forEach((l, i) => {
    const a = el("a", { href: l.href, text: l.name });
    try {
      const u = new URL(l.href, location.origin);
      if (u.origin !== location.origin) safeExternalLink(a);
    } catch {}
    box.appendChild(a);
    if (i < links.length - 1) box.appendChild(document.createTextNode(" · "));
  });
}

function renderGrid(sel, items, opts = {}) {
  const grid = $(sel);
  if (!grid) return;
  clear(grid);
  (items || []).forEach((it) => grid.appendChild(card(it, opts)));
}

function setHeroCTAs(data) {
  const row = document.getElementById("hero-ctas");
  if (!row) return;

  const cta = data.cta || FALLBACK.cta;
  const p = cta?.primary;
  const s = cta?.secondary;
  if (!p?.href || !s?.href) return;

  row.innerHTML = "";
  const a1 = el("a", { class: "btn primary", href: p.href, text: p.label || "Open" });
  const a2 = el("a", { class: "btn", href: s.href, text: s.label || "Browse" });

  // external -> new tab
  try { if (new URL(a1.href, location.origin).origin !== location.origin) safeExternalLink(a1); } catch {}
  try { if (new URL(a2.href, location.origin).origin !== location.origin) safeExternalLink(a2); } catch {}

  row.append(a1, a2);
}

(async function init() {
  $("#year").textContent = String(new Date().getFullYear());

  let data = FALLBACK;
  let usingFallback = false;

  try {
    data = await fetchJSON(CONFIG.WWW_JSON_URL);
  } catch (e) {
    usingFallback = true;
    const n = $("#notice");
    if (n) {
      n.style.display = "block";
      n.textContent = `Couldn’t load www.json (${String(e.message || e)}). Showing fallback.`;
    }
  }

  // tagline
  if (data?.meta?.tagline) $("#tagline").textContent = data.meta.tagline;

  // updated
  if (data?.meta?.updated) $("#updated").textContent = `Updated ${data.meta.updated}`;
  else $("#updated").textContent = usingFallback ? "Offline mode" : "—";

  // identity hero
  const identity = data.identity || FALLBACK.identity;
  if (identity?.title) $("#hero-title").textContent = identity.title;
  $("#hero-sub").textContent = identity?.body || identity?.headline || FALLBACK.identity.body;

  // philosophy tile in hero side
  const ph = data.philosophy || FALLBACK.philosophy;
  if (ph?.title) $("#philosophy-title").textContent = ph.title;
  if (ph?.body) $("#philosophy-body").textContent = ph.body;

  // CTAs
  setHeroCTAs(data);

  // grids
  renderGrid("#featured-grid", Array.isArray(data.featured) ? data.featured : FALLBACK.featured, { feature: true });
  renderGrid("#now-grid", Array.isArray(data.now) ? data.now : FALLBACK.now);
  renderGrid("#future-grid", Array.isArray(data.future) ? data.future : FALLBACK.future);

  setFooterLinks(data);
})();