import { useState, useEffect } from "react";
import { G } from "../components/Logo";
import MonoLabel from "../components/MonoLabel";
import GlassCard from "../components/GlassCard";
import Badge from "../components/Badge";

const DEMO_SCANS = [
  { id: "d1", verdict: "FAKE", confidence: 94, input_type: "text", input_text: "AMAZING!!! Best product EVER!! 5 stars all the way!! Must buy!!!", created_at: new Date(Date.now()-3600000).toISOString(), summary: "Highly artificial review with repetitive exclamations and no specific product details." },
  { id: "d2", verdict: "GENUINE", confidence: 87, input_type: "text", input_text: "Decent quality, arrived 2 days late but the packaging was solid. Would buy again for the price.", created_at: new Date(Date.now()-7200000).toISOString(), summary: "Balanced review with specific product feedback and moderate sentiment." },
  { id: "d3", verdict: "SUSPICIOUS", confidence: 71, input_type: "text", input_text: "Really good product. Works as described. Happy with my purchase. Would buy again.", created_at: new Date(Date.now()-86400000).toISOString(), summary: "Generic positive review lacking specific details. Pattern consistent with incentivized reviews." },
  { id: "d4", verdict: "FAKE", confidence: 91, input_type: "text", input_text: "⭐⭐⭐⭐⭐ BEST THING EVER!!! 💯🔥 So good!!! Must have!!! Perfect!!!", created_at: new Date(Date.now()-172800000).toISOString(), summary: "Emoji spam and extreme superlatives with zero product specifics indicate fabricated review." },
  { id: "d5", verdict: "GENUINE", confidence: 82, input_type: "text", input_text: "After using this moisturizer for a month, I can say it works fairly well for my combination skin.", created_at: new Date(Date.now()-259200000).toISOString(), summary: "Detailed personal experience with nuanced opinion and time-based observations." },
];

export default function HistoryPage({ user, setPage }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);

      const token = localStorage.getItem("sentinel_token");
      if (token) {
        try {
          const res = await fetch("/api/scans", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setScans(data.scans?.length ? data.scans : DEMO_SCANS);
            setLoading(false);
            return;
          }
        } catch { /* backend offline */ }
      }
      setScans(DEMO_SCANS);
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, padding: "120px 24px" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: "rgba(200,255,0,.15)", lineHeight: 1 }}>LOCKED</div>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: G.dim, letterSpacing: ".08em" }}>Sign in to view your scan history</p>
        <button onClick={() => setPage("auth")} style={{ background: G.lime, color: G.void, padding: "14px 36px", fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", borderRadius: 4, clipPath: "polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))" }}>Sign In →</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "120px 24px 80px", maxWidth: 860, margin: "0 auto" }}>
      <div className="anim-upIn" style={{ marginBottom: 48 }}>
        <MonoLabel style={{ marginBottom: 12 }}>Scan History</MonoLabel>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(52px,8vw,88px)", lineHeight: .9, marginBottom: 12 }}>YOUR<br/>ANALYSES</h1>
        <p style={{ fontSize: 14, color: G.dim, fontWeight: 300 }}>All your past review scans, stored securely.</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "40px 0", color: G.dim, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, letterSpacing: ".08em" }}>
          <div style={{ width: 14, height: 14, border: `2px solid ${G.lime}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          Loading history...
        </div>
      ) : scans.length === 0 ? (
        <GlassCard style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: "rgba(200,255,0,.1)", marginBottom: 16 }}>EMPTY</div>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: G.dim, letterSpacing: ".06em" }}>No scans yet. Analyze your first review!</p>
          <button onClick={() => setPage("analyzer")} style={{ marginTop: 20, background: G.lime, color: G.void, padding: "12px 28px", fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 11, border: "none", cursor: "pointer" }}>Go to Analyzer →</button>
        </GlassCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {scans.map((scan, i) => (
            <div key={scan.id || i} className="anim-upIn" style={{ animationDelay: `${i * 0.06}s` }}>
              <GlassCard style={{ padding: "22px 26px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <Badge verdict={scan.verdict} />
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".12em", color: G.dim, textTransform: "uppercase", background: "rgba(255,255,255,.04)", padding: "3px 8px", borderRadius: 3 }}>
                        ✏ TEXT
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: G.dim, lineHeight: 1.55, marginBottom: 8, fontStyle: "italic" }}>
                      "{scan.input_text?.slice(0,100)}{scan.input_text?.length > 100 ? "..." : ""}"
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(240,240,240,.5)", lineHeight: 1.55 }}>{scan.summary}</p>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "rgba(240,240,240,.2)", letterSpacing: ".08em", marginTop: 10 }}>
                      {new Date(scan.created_at).toLocaleDateString()} · {new Date(scan.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, lineHeight: 1, color: { FAKE: G.fake, GENUINE: G.real, SUSPICIOUS: G.sus }[scan.verdict] }}>{scan.confidence}%</div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, letterSpacing: ".1em", color: "rgba(240,240,240,.2)", textTransform: "uppercase" }}>Confidence</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
