// js/core/boot.js
import { mountTopbar } from "./topbar.js";

mountTopbar("#topbar");

const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}