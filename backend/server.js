const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const scanRoutes = require("./routes/scans");
const scrapeRoutes = require("./routes/scrape");

const app = express();
const PORT = process.env.PORT || 3001;

/* ── Middleware ──────────────────────────────────────────── */
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "https://sentinelv3.netlify.app"], credentials: true }));
app.use(express.json({ limit: "2mb" }));

/* ── Routes ─────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/scrape", scrapeRoutes);

/* ── Health check ───────────────────────────────────────── */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "sentinel-api", timestamp: new Date().toISOString() });
});

/* ── Start ──────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n  🛡️  Sentinel API running → http://localhost:${PORT}`);
  console.log(`  📡  Health check       → http://localhost:${PORT}/api/health\n`);
});
