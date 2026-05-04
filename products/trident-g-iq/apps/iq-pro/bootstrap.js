import { initIqProCloud } from "./runtime/cloud/iq-pro-cloud.js";

async function startIqPro() {
  await initIqProCloud();
  await import("./app.js");
}

startIqPro().catch((error) => {
  const root = document.getElementById("app");
  if (!root) return;
  root.innerHTML = [
    '<section class="play-card">',
    "<h2>Trident G IQ Pro could not start</h2>",
    '<p class="status-copy">The app loaded, but a startup module failed.</p>',
    '<pre class="small muted" style="white-space:pre-wrap;">',
    String(error && (error.stack || error.message) || error).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]),
    "</pre>",
    "</section>"
  ].join("");
});
