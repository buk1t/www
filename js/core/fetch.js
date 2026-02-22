// js/core/fetch.js
import { CONFIG } from "./config.js";

export async function fetchJSON(url, { timeoutMs = CONFIG.FETCH_TIMEOUT_MS } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } finally {
    clearTimeout(t);
  }
}