// js/pages/apps.js
import { CONFIG } from "../core/config.js";
import { fetchJSON } from "../core/fetch.js";
import { $, el, clear, safeExternalLink } from "../core/render.js";

const FALLBACK_APPS = [
  { id: "search", name: "Search", desc: "Fast routing across buk1t.", href: "https://search.buk1t.com", stage: "stable", tags: ["utility"] },
  { id: "labs", name: "Labs", desc: "Experiments & prototypes.", href: "https://labs.buk1t.com", stage: "experimental", tags: ["playground"] }
];

function appCard(app) {
  const a = el("a", { class: "card span-6", href: app.href }, [
    el("div", { class: "card-top" }, [
      el("h3", { class: "card-title", text: app.name || app.id || "App" }),
      app.stage ? el("span", { class: "badge", text: String(app.stage) }) : null
    ]),
    app.desc ? el("p", { class: "card-desc", text: app.desc }) : null,
    Array.isArray(app.tags) && app.tags.length
      ? el("div", { class: "tags" }, app.tags.slice(0, 6).map(t => el("span", { class: "tag", text: t })))
      : null
  ]);

  try {
    const u = new URL(app.href, location.origin);
    if (u.origin !== location.origin) safeExternalLink(a);
  } catch {}

  return a;
}

function setFooterLinks(data) {
  const box = $("#footer-links");
  if (!box) return;
  clear(box);
  const links = (data.links && Array.isArray(data.links)) ? data.links : [{ name: "Home", href: "/" }];
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

(async function init() {
  $("#year").textContent = String(new Date().getFullYear());

  let data = null;
  let usingFallback = false;

  try {
    data = await fetchJSON(CONFIG.WWW_JSON_URL);
  } catch (e) {
    usingFallback = true;
    const n = $("#apps-notice");
    if (n) {
      n.style.display = "block";
      n.textContent = `Couldn’t load apps JSON (${String(e.message || e)}). Showing fallback.`;
    }
  }

  const apps = Array.isArray(data?.apps) ? data.apps : FALLBACK_APPS;

  const meta = $("#apps-meta");
  meta.textContent = usingFallback ? "Offline mode" : (data?.meta?.updated ? `Updated ${data.meta.updated}` : "—");

  const grid = $("#apps-grid");
  clear(grid);
  apps.forEach(a => grid.appendChild(appCard(a)));

  setFooterLinks(data || {});
})();