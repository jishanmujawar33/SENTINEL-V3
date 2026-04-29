const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { insert, findMany } = require("../utils/storage");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/* ── POST /api/scans — Save a new scan result ───────────── */
router.post("/", authMiddleware, (req, res) => {
  try {
    const { input_type, input_text, verdict, confidence, signals, summary, red_flags, positive_signals } = req.body;

    const scan = {
      id: uuidv4(),
      user_id: req.user.id,
      input_type: input_type || "text",
      input_text: input_text || "",
      verdict,
      confidence,
      signals,
      summary,
      red_flags: red_flags || [],
      positive_signals: positive_signals || [],
      created_at: new Date().toISOString(),
    };

    insert("scans", scan);
    res.status(201).json({ scan });
  } catch (err) {
    console.error("Save scan error:", err);
    res.status(500).json({ error: "Failed to save scan" });
  }
});

/* ── GET /api/scans — Get user's scan history ────────────── */
router.get("/", authMiddleware, (req, res) => {
  try {
    const scans = findMany("scans", (s) => s.user_id === req.user.id);
    // Return newest first
    scans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ scans: scans.slice(0, 50) });
  } catch (err) {
    console.error("Get scans error:", err);
    res.status(500).json({ error: "Failed to fetch scans" });
  }
});

module.exports = router;
