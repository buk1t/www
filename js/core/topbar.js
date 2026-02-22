// www/js/core/topbar.js
import { el, clear } from "./render.js";

function normPath(p) {
  // Ensure trailing slash for consistent comparisons (you use trailingSlash: true)
  if (!p) return "/";
  if (!p.startsWith("/")) p = "/" + p;
  return p.endsWith("/") ? p : p + "/";
}

function isActive(current, href) {
  const c = normPath(current);
  const h = normPath(href);

  // Home is only active on exact "/"
  if (h === "/") return c === "/";

  // Other tabs: active when path starts with that section
  return c.startsWith(h);
}

export function mountTopbar(targetSelector = "#topbar") {
  const host = document.querySelector(targetSelector);
  if (!host) return;

  // You control these per-page via attributes:
  // <header id="topbar" data-hint="apps"> or data-tagline="true" for the home tagline span id="tagline"
  const hint = host.getAttribute("data-hint") || "";
  const useTaglineId = host.getAttribute("data-tagline") === "true";

  const links = [
    { label: "Home", href: "/" },
    { label: "Apps", href: "/apps/" },
    { label: "Status", href: "/status/" },
    { label: "About", href: "/about/" },
    { label: "Contact", href: "/contact/" }
  ];

  const current = location.pathname;

  const header = el("header", { class: "topbar" }, [
    el("a", { class: "brand", href: "/" }, [
      el("span", { class: "name", text: "buk1t" }),
      useTaglineId
        ? el("span", { class: "hint", id: "tagline", text: hint || "a personal internet system" })
        : el("span", { class: "hint", text: hint })
    ]),
    el(
      "nav",
      { class: "nav" },
      links.map((l) =>
        el("a", {
          class: `pill${isActive(current, l.href) ? " is-active" : ""}`,
          href: l.href,
          text: l.label
        })
      )
    )
  ]);

  clear(host);
  host.appendChild(header);
}