// js/pages/status.js
document.getElementById("year").textContent = String(new Date().getFullYear());

const box = document.getElementById("status-box");
box.textContent = "Status is intentionally minimal right now. Put health checks here later if you want.";