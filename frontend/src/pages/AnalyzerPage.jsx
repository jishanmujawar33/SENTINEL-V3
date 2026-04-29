import { useState } from "react";
import { G } from "../components/Logo";
import MonoLabel from "../components/MonoLabel";
import GlassCard from "../components/GlassCard";
import Badge from "../components/Badge";
import { analyzeReview } from "../engine/bert";
import { SAMPLE_REVIEWS } from "../engine/sampleReviews";

export default function AnalyzerPage({ user, setPage }) {
  const [inputMode, setInputMode] = useState("text"); // "text" | "url"
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showSamples, setShowSamples] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const runAnalysis = async () => {
    setError("");
    setResult(null);
    setScanProgress(0);

    let analysisText = text;

    if (inputMode === "url") {
      if (!url.trim()) return setError("Please enter a valid URL.");
      setLoading(true);
      setScanProgress(5); // Scraping starts
      try {
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to extract text from URL.");
        analysisText = data.text;
        setScanProgress(15);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
        return;
      }
    } else {
      if (!text.trim()) return setError("Please paste a review text.");
      setLoading(true);
    }

    // Simulate scanning progress for UX
    const steps = [25, 40, 55, 70, 85, 95];
    for (const s of steps) {
      if (s < scanProgress) continue;
      await new Promise(r => setTimeout(r, 80));
      setScanProgress(s);
    }

    try {
      const analysisResult = await analyzeReview(analysisText);
      setScanProgress(100);
      await new Promise(r => setTimeout(r, 200));
      setResult(analysisResult);

      // Save to backend if authenticated
      const token = localStorage.getItem("sentinel_token");
      if (token) {
        try {
          await fetch("/api/scans", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              input_type: inputMode,
              input_text: inputMode === "url" ? url : analysisText,
              verdict: analysisResult.verdict,
              confidence: analysisResult.confidence,
              signals: analysisResult.signals,
              summary: analysisResult.summary,
              red_flags: analysisResult.red_flags,
              positive_signals: analysisResult.positive_signals,
            }),
          });
        } catch { /* Backend offline — scan still works */ }
      }
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample) => {
    setInputMode("text");
    setText(sample.text);
    setResult(null);
    setShowSamples(false);
    setError("");
  };

  const verdictColor = result ? { FAKE: G.fake, GENUINE: G.real, SUSPICIOUS: G.sus }[result.verdict] : G.lime;

  // Calculate Product Trust Score: GENUINE boosts, FAKE drops it
  let trustScore = 50;
  if (result) {
    if (result.verdict === "GENUINE") trustScore = 50 + (result.confidence / 2);
    else if (result.verdict === "FAKE") trustScore = 50 - (result.confidence / 2);
    else trustScore = 50; // SUSPICIOUS stays near 50
    trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));
  }

  const trustColor = trustScore >= 70 ? G.real : trustScore <= 30 ? G.fake : G.sus;

  return (
    <div style={{ minHeight: "100vh", padding: "120px 24px 80px", maxWidth: 860, margin: "0 auto" }}>
      <div className="anim-upIn" style={{ marginBottom: 48 }}>
        <MonoLabel style={{ marginBottom: 12 }}>BERT Neural Engine</MonoLabel>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(52px,8vw,88px)", lineHeight: .9, marginBottom: 12 }}>TRUTH<br/>DETECTOR</h1>
        <p style={{ fontSize: 14, color: G.dim, fontWeight: 300, maxWidth: 520 }}>
          Analyze any review or product page. Our BERT Transformer engine performs deep semantic analysis of text to classify authenticity with high-dimensional neural accuracy.
        </p>
        {!user && <div style={{ marginTop: 14, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: G.sus, letterSpacing: ".06em" }}>⚠ Sign in to save your scan history</div>}
      </div>

      {/* INPUT AREA */}
      <GlassCard style={{ padding: 28, marginBottom: 20 }}>
        {/* Toggle Mode */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setInputMode("text")} style={{ flex: 1, padding: "12px", background: inputMode === "text" ? "rgba(255,255,255,.06)" : "transparent", border: `1px solid ${inputMode === "text" ? "rgba(255,255,255,.15)" : G.border}`, color: inputMode === "text" ? G.fg : G.dim, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", cursor: "pointer", borderRadius: 6, transition: "all .2s" }}>
            📝 Paste Text
          </button>
          <button onClick={() => setInputMode("url")} style={{ flex: 1, padding: "12px", background: inputMode === "url" ? "rgba(255,255,255,.06)" : "transparent", border: `1px solid ${inputMode === "url" ? "rgba(255,255,255,.15)" : G.border}`, color: inputMode === "url" ? G.fg : G.dim, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", cursor: "pointer", borderRadius: 6, transition: "all .2s" }}>
            🔗 Scan Link
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <MonoLabel>{inputMode === "text" ? "Review Text" : "Product or Review URL"}</MonoLabel>
          {inputMode === "text" && (
            <button onClick={() => setShowSamples(!showSamples)}
              style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".08em", color: showSamples ? G.lime : G.dim, background: showSamples ? "rgba(200,255,0,.08)" : "transparent", border: `1px solid ${showSamples ? "rgba(200,255,0,.3)" : G.border}`, padding: "6px 14px", borderRadius: 4, cursor: "pointer", transition: "all .2s", textTransform: "uppercase" }}>
              {showSamples ? "✕ Close" : "⚡ Try Samples"}
            </button>
          )}
        </div>

        {/* Sample Reviews Drawer */}
        {showSamples && inputMode === "text" && (
          <div className="anim-slideDown" style={{ marginBottom: 16, maxHeight: 280, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 8 }}>
            {SAMPLE_REVIEWS.map(s => (
              <button key={s.id} onClick={() => loadSample(s)}
                style={{
                  textAlign: "left", padding: "12px 14px",
                  background: "rgba(255,255,255,.03)",
                  border: `1px solid ${G.border}`,
                  borderRadius: 6, cursor: "pointer", transition: "all .2s",
                  display: "flex", flexDirection: "column", gap: 6, color: G.fg,
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(200,255,0,.3)"; e.currentTarget.style.background = "rgba(200,255,0,.04)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge verdict={s.label} />
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, color: G.dim, letterSpacing: ".08em", textTransform: "uppercase" }}>{s.category}</span>
                </div>
                <div style={{ fontSize: 11, color: G.dim, lineHeight: 1.4, fontStyle: "italic", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  "{s.text.slice(0, 100)}..."
                </div>
              </button>
            ))}
          </div>
        )}

        {inputMode === "text" ? (
          <>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Paste any review here — from Amazon, Google Maps, App Store, Yelp..."
              style={{ width: "100%", minHeight: 160, padding: 16, background: "rgba(255,255,255,.03)", border: `1px solid ${G.border}`, color: G.fg, fontFamily: "'DM Sans',sans-serif", fontSize: 14, lineHeight: 1.7, resize: "vertical", outline: "none", borderRadius: 6, transition: "border .2s" }}
              onFocus={e => e.target.style.borderColor = "rgba(200,255,0,.3)"}
              onBlur={e => e.target.style.borderColor = G.border} />
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "rgba(240,240,240,.2)", letterSpacing: ".1em", marginTop: 8 }}>
              {text.length} chars · {text.split(/\s+/).filter(Boolean).length} words
            </div>
          </>
        ) : (
          <>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://www.example.com/product/reviews..."
              style={{ width: "100%", padding: 16, background: "rgba(255,255,255,.03)", border: `1px solid ${G.border}`, color: G.fg, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", borderRadius: 6, transition: "border .2s" }}
              onFocus={e => e.target.style.borderColor = "rgba(200,255,0,.3)"}
              onBlur={e => e.target.style.borderColor = G.border} />
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "rgba(240,240,240,.4)", marginTop: 12, lineHeight: 1.5 }}>
              Enter a link to a product page or a review page. Our engine will fetch the page, extract paragraph text, and analyze the aggregated content for signs of inauthenticity.
            </div>
          </>
        )}
      </GlassCard>

      {error && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: G.fake, letterSpacing: ".06em", marginBottom: 16, padding: "12px 16px", background: "rgba(255,45,85,.08)", border: "1px solid rgba(255,45,85,.2)", borderRadius: 6 }}>⚠ {error}</div>}

      {/* Scan Progress Bar */}
      {loading && (
        <div className="anim-fadeIn" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: G.lime, letterSpacing: ".08em" }}>ANALYZING...</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: G.dim }}>{scanProgress}%</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${scanProgress}%`, background: `linear-gradient(90deg, ${G.lime}, #00ffb3)`, borderRadius: 2, transition: "width .3s ease" }} />
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "rgba(240,240,240,.2)", marginTop: 6, letterSpacing: ".06em" }}>
            {scanProgress < 20 ? "Fetching and extracting text..." : scanProgress < 40 ? "Extracting NLP features..." : scanProgress < 70 ? "Running BERT Neural Transformer..." : scanProgress < 90 ? "Computing signal breakdown..." : "Finalizing verdict..."}
          </div>
        </div>
      )}

      <button onClick={runAnalysis} disabled={loading}
        style={{ display: "flex", alignItems: "center", gap: 12, background: loading ? "rgba(200,255,0,.5)" : G.lime, color: G.void, padding: "16px 44px", fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", border: "none", cursor: loading ? "default" : "pointer", clipPath: "polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))", transition: "all .25s", marginBottom: 48 }}>
        {loading ? (
          <><div style={{ width: 14, height: 14, border: `2px solid ${G.void}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />Scanning...</>
        ) : "Run Neural Analysis ↗"}
      </button>

      {/* EMPTY STATE - Informational Grid */}
      {!result && !loading && (
        <div className="anim-fadeIn" style={{ marginTop: 24 }}>
          <MonoLabel style={{ marginBottom: 20 }}>The 14-Signal Detection Engine</MonoLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
            {[
              ["Linguistic Patterns", "Analyzes punctuation variety, caps ratio, and word length to detect bot-like generation."],
              ["Emotional Polarity", "Flags unnaturally extreme positive or negative sentiment that lacks nuance."],
              ["Behavioral Signals", "Detects template repetition and unnatural lack of first-person pronouns."],
              ["Detail Specificity", "Measures the presence of physical measurements, numbers, and comparisons."],
              ["Temporal Context", "Checks for realistic timeframes and duration markers in the review."],
              ["Lexical Diversity", "Measures vocabulary richness to catch repetitive spam campaigns."]
            ].map(([title, desc]) => (
              <GlassCard key={title} style={{ padding: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: G.lime, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 12, color: G.dim, lineHeight: 1.6 }}>{desc}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="anim-upIn" style={{ marginBottom: 60 }}>
          
          {/* Trust Score & Verdict Header */}
          <GlassCard style={{ padding: 32, marginBottom: 24, background: "linear-gradient(135deg, rgba(200,255,0,0.03) 0%, rgba(0,0,0,0) 100%)", borderTop: `2px solid ${verdictColor}` }}>
            <div className="sentinel-verdict-row" style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".1em", color: G.dim, textTransform: "uppercase", marginBottom: 8 }}>Final Verdict</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(48px,8vw,72px)", lineHeight: 1, color: verdictColor, marginBottom: 12 }}>
                  {result.confidence >= 95 ? (result.verdict === "GENUINE" ? "VERIFIED TRUTH" : "DEFINITIVE FRAUD") : result.verdict}
                </div>
                <Badge verdict={result.verdict} />
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: G.dim, marginTop: 16, lineHeight: 1.5 }}>
                  Analysis Certainty: <strong style={{ color: verdictColor }}>{result.confidence}%</strong>
                </div>
              </div>
               
              <div className="sentinel-verdict-divider" style={{ width: 1, height: 100, background: G.border, display: "block" }} />

              <div className="sentinel-trust-orb-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative", width: 120, height: 120, borderRadius: "50%", background: "rgba(10,12,20,0.85)", border: `3px solid ${trustColor}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${trustColor}30`, animation: "orbPulse 2s ease-in-out infinite" }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, lineHeight: 1, color: trustColor }}>{trustScore}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, letterSpacing: ".1em", color: G.dim, textTransform: "uppercase", marginTop: 2 }}>/ 100</div>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".1em", color: G.dim, textTransform: "uppercase" }}>Product Trust Score</div>
              </div>
            </div>
          </GlassCard>

          {/* Probability distribution */}
          <GlassCard style={{ padding: "18px 26px", marginBottom: 16 }}>
            <MonoLabel style={{ marginBottom: 10 }}>Class Probabilities</MonoLabel>
            <div style={{ display: "flex", gap: 16 }}>
              {[["Fake", result.probabilities.fake, G.fake], ["Suspicious", result.probabilities.suspicious, G.sus], ["Genuine", result.probabilities.genuine, G.real]].map(([l,v,c]) => (
                <div key={l} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: c, lineHeight: 1 }}>{v}%</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, letterSpacing: ".12em", color: G.dim, textTransform: "uppercase", marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Understanding the Results (New UI Enhancement) */}
          <GlassCard style={{ padding: "22px 26px", marginBottom: 16, background: "rgba(255,255,255,0.01)" }}>
            <MonoLabel style={{ marginBottom: 10, color: G.lime }}>Understanding Your Results</MonoLabel>
            <p style={{ fontSize: 14, color: G.fg, lineHeight: 1.75, fontWeight: 300, marginBottom: 16 }}>
              {result.summary}
            </p>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: G.dim, borderTop: `1px solid ${G.border}`, paddingTop: 12 }}>
              A trust score of <strong>{trustScore}</strong> implies that based on the detected signals, the aggregated review content leans {trustScore > 65 ? "heavily toward genuine human experiences." : trustScore < 35 ? "strongly toward coordinated, automated, or biased behavior." : "toward mixed authenticity with some concerning anomalies."}
            </div>
          </GlassCard>

          {/* Signal bars */}
          <GlassCard style={{ padding: "22px 26px", marginBottom: 16 }}>
            <MonoLabel style={{ marginBottom: 16 }}>Signal Breakdown</MonoLabel>
            {[
              ["Linguistic Pattern", result.signals?.linguistic_score, G.lime],
              ["Sentiment Analysis", result.signals?.sentiment_score, "#818cf8"],
              ["Behavioral Signals", result.signals?.behavioral_score, G.sus],
              ["Pattern Recognition", result.signals?.pattern_score, G.real],
            ].map(([label, val, color]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".08em", color: G.dim, textTransform: "uppercase" }}>{label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color, fontWeight: 500 }}>{val ?? "—"}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${val ?? 0}%`, background: color, borderRadius: 2, transition: "width 1s ease" }} />
                </div>
              </div>
            ))}
          </GlassCard>

          {/* Flags */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            {result.red_flags?.length > 0 && (
              <GlassCard style={{ padding: "22px 26px" }}>
                <MonoLabel style={{ color: "rgba(255,45,85,.6)", marginBottom: 14 }}>Red Flags</MonoLabel>
                {result.red_flags.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: G.fake, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "rgba(255,45,85,.8)", lineHeight: 1.55 }}>{f}</span>
                  </div>
                ))}
              </GlassCard>
            )}
            {result.positive_signals?.length > 0 && (
              <GlassCard style={{ padding: "22px 26px" }}>
                <MonoLabel style={{ color: "rgba(0,255,179,.5)", marginBottom: 14 }}>Authenticity Signals</MonoLabel>
                {result.positive_signals.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: G.real, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "rgba(0,255,179,.8)", lineHeight: 1.55 }}>{f}</span>
                  </div>
                ))}
              </GlassCard>
            )}
          </div>

          <button onClick={() => { setResult(null); setText(""); setUrl(""); }}
            style={{ marginTop: 28, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: G.dim, background: "none", border: `1px solid ${G.border}`, padding: "12px 24px", cursor: "pointer", borderRadius: 4, transition: "all .2s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(200,255,0,.3)"; e.currentTarget.style.color = G.lime; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.dim; }}>
            ← Analyze Another
          </button>
        </div>
      )}
    </div>
  );
}
