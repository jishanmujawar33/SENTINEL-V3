import { G } from "../components/Logo";
import MonoLabel from "../components/MonoLabel";
import GlassCard from "../components/GlassCard";

const mqItems = ["Review Forensics","Behavioral Signals","Sentiment Mapping","BERT Neural Engine","NLP Detection","Authenticity Scoring","Pattern Recognition","Neural Transformer"];

const TEAM = [
  { name: "Zeeshan", role: "Lead Developer", img: "/member1.jpg" },
  { name: "Vibhavri", role: "AI Researcher", img: "/member2.jpg" },
  { name: "Shubham", role: "Backend Engineer", img: "/member3.jpg" },
  { name: "Tejaswini", role: "Product Designer", img: "/member4.jpg" },
];

export default function HomePage({ setPage, user }) {
  return (
    <div>
      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", zIndex: 10 }}>
        <div className="anim-upIn" style={{ animationDelay: ".1s", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(200,255,0,.6)", marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 1, background: "rgba(200,255,0,.35)" }} />
          BERT Neural Transformer Engine
          <div style={{ width: 36, height: 1, background: "rgba(200,255,0,.35)" }} />
        </div>

        <h1 className="anim-upIn" style={{ animationDelay: ".25s", fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(90px,18vw,220px)", lineHeight: .88, letterSpacing: ".03em", userSelect: "none", background: "linear-gradient(160deg,#fff 0%,rgba(200,255,0,.85) 60%,#fff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", backgroundSize: "200% 100%", animation: "shimmer 4s ease-in-out infinite, upIn .9s .25s both" }}>
          SENTINEL V3
        </h1>

        <p className="anim-upIn" style={{ animationDelay: ".4s", marginTop: 24, fontSize: "clamp(14px,2vw,17px)", color: G.dim, fontWeight: 300, lineHeight: 1.7, maxWidth: 460 }}>
          Every fake review leaves a trace. We find it — across text, sentiment, and behavioral signals — using gradient boosting AI.
        </p>

        <div className="anim-upIn sentinel-hero-buttons" style={{ animationDelay: ".55s", marginTop: 48, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => setPage("analyzer")}
            style={{ display: "inline-flex", alignItems: "center", gap: 12, background: G.lime, color: G.void, padding: "18px 48px", fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", border: "none", cursor: "pointer", clipPath: "polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))", transition: "background .25s,box-shadow .25s" }}
            onMouseOver={e => { e.currentTarget.style.background = "#d4ff1e"; e.currentTarget.style.boxShadow = "0 0 60px rgba(200,255,0,.35)"; }}
            onMouseOut={e => { e.currentTarget.style.background = G.lime; e.currentTarget.style.boxShadow = "none"; }}>
            Analyze a Review ↗
          </button>
          {!user && (
            <button onClick={() => setPage("auth")}
              style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "transparent", color: G.lime, padding: "18px 48px", fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", border: "1px solid rgba(200,255,0,.35)", cursor: "pointer", clipPath: "polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))", transition: "all .25s" }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(200,255,0,.08)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              Create Account
            </button>
          )}
        </div>

        <div className="anim-upIn sentinel-hero-stats" style={{ animationDelay: ".7s", marginTop: 72, display: "flex", border: `1px solid ${G.border}`, flexWrap: "wrap" }}>
          {[["98.4%","Accuracy"],["14+","NLP Signals"],["<0.3s","Detection"],["25","XGB Trees"]].map(([n,l]) => (
            <div key={l} style={{ padding: "22px 36px", textAlign: "center", borderRight: `1px solid ${G.border}` }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 40, lineHeight: 1, color: G.lime }}>{n}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(240,240,240,.3)", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ overflow: "hidden", borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}`, padding: "14px 0", background: "rgba(200,255,0,.02)" }}>
        <div style={{ display: "flex", gap: 48, animation: "mq 22s linear infinite", whiteSpace: "nowrap" }}>
          {[...mqItems,...mqItems].map((item,i) => (
            <div key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: ".22em", color: "rgba(240,240,240,.22)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
              {item}<span style={{ color: G.lime, opacity: .5 }}>✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="sentinel-section-pad" style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 48px" }}>
        <MonoLabel style={{ marginBottom: 16 }}>Capabilities</MonoLabel>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(52px,8vw,96px)", lineHeight: .9, marginBottom: 56 }}>BUILT TO<br/>SEE THROUGH<br/>EVERYTHING.</h2>
        <div className="sentinel-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 1, background: G.border }}>
          {[
            ["01","Language","Linguistic Forensics","Detects bot-generated phrasing, keyword stuffing, repetitive superlatives, and unnatural sentence cadence at scale."],
            ["02","ML Engine","BERT Transformer","High-dimensional neural network analyzing 14 NLP features with deep semantic probability output for FAKE/GENUINE/SUSPICIOUS classification."],
            ["03","Emotion","Sentiment Mapping","Real reviews have nuance. We model emotional complexity and catch suspiciously perfect polarity and manufactured enthusiasm."],
            ["04","Pattern","Behavioral Analysis","Lexical diversity, sentence variance, pronoun usage, hedging language — subtle signals that separate humans from bots."],
          ].map(([n,tag,title,desc]) => (
            <div key={n} style={{ background: G.void, padding: "38px 34px", position: "relative", overflow: "hidden", cursor: "default", transition: "background .3s" }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(200,255,0,.025)"}
              onMouseOut={e => e.currentTarget.style.background = G.void}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(200,255,0,.5)", marginBottom: 18 }}>{n} — {tag}</div>
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{title}</div>
              <p style={{ fontSize: 13, color: G.dim, lineHeight: 1.75, fontWeight: 300 }}>{desc}</p>
              <div style={{ position: "absolute", bottom: 12, right: 18, fontFamily: "'Bebas Neue',sans-serif", fontSize: 68, color: "rgba(200,255,0,.04)", lineHeight: 1 }}>{n}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sentinel-section-pad" style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 48px", borderTop: `1px solid ${G.border}` }}>
        <MonoLabel style={{ marginBottom: 16 }}>Process</MonoLabel>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(52px,8vw,96px)", lineHeight: .9, marginBottom: 56 }}>THREE STEPS.<br/>ZERO DOUBT.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 40 }}>
          {[
            ["01","Input Review Text","Paste any review — from Amazon, Google Maps, App Store, Yelp. The engine handles any text format."],
            ["02","14-Signal Extraction","NLP engine extracts exclamation density, caps ratio, superlatives, lexical diversity, and 10 more behavioral features."],
            ["03","Neural Verdict","BERT Neural Transformer produces GENUINE, SUSPICIOUS, or FAKE — with confidence score and full signal breakdown."],
          ].map(([n,t,d]) => (
            <div key={n} style={{ padding: "0 6px" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 76, color: "rgba(200,255,0,.1)", lineHeight: 1, marginBottom: -10 }}>{n}</div>
              <div style={{ width: 40, height: 2, background: G.lime, opacity: .35, marginBottom: 18 }} />
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{t}</div>
              <p style={{ fontSize: 13, color: G.dim, lineHeight: 1.8, fontWeight: 300 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST STATS */}
      <div className="sentinel-trust-stats-grid" style={{ borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {[["98.4%","Detection Accuracy"],["14","NLP Features"],["25","Boosting Trees"],["0.3s","Avg Response"]].map(([n,l]) => (
          <div key={l} style={{ padding: "46px 34px", textAlign: "center", borderRight: `1px solid ${G.border}` }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, lineHeight: 1, background: `linear-gradient(135deg,${G.fg},rgba(200,255,0,.7))`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(240,240,240,.28)", marginTop: 6 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* TEAM SECTION */}
      <section className="sentinel-section-pad" style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 48px", borderTop: `1px solid ${G.border}` }}>
        <MonoLabel style={{ marginBottom: 16 }}>Contributors</MonoLabel>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(52px,8vw,96px)", lineHeight: .9, marginBottom: 24 }}>THE TEAM<br/>BEHIND<br/><span style={{ color: G.lime }}>SENTINEL.</span></h2>
        <p style={{ fontSize: 14, color: G.dim, fontWeight: 300, lineHeight: 1.7, maxWidth: 500, marginBottom: 56 }}>
          Built by a passionate team of engineers and researchers dedicated to fighting misinformation and protecting consumers from deceptive reviews.
        </p>
        <div className="sentinel-team-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {TEAM.map((member, i) => (
            <GlassCard key={i} style={{ padding: 0, overflow: "hidden", cursor: "default", transition: "transform .3s, border-color .3s", borderColor: G.border }}>
              <div
                onMouseOver={e => { e.currentTarget.parentElement.style.transform = "translateY(-6px)"; e.currentTarget.parentElement.style.borderColor = "rgba(200,255,0,.25)"; }}
                onMouseOut={e => { e.currentTarget.parentElement.style.transform = "translateY(0)"; e.currentTarget.parentElement.style.borderColor = G.border; }}
              >
                {/* Avatar */}
                <div style={{ width: "100%", aspectRatio: "1/1", background: `url(${member.img})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "rgba(255,255,255,0.03)", position: "relative", overflow: "hidden" }}>
                  {/* Overlay gradient */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(3,4,10,0.9) 0%, transparent 60%)" }} />
                  {/* Role tag */}
                  <div style={{ position: "absolute", top: 12, right: 12, fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, letterSpacing: ".12em", textTransform: "uppercase", color: G.lime, background: "rgba(3,4,10,0.7)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 3, border: "1px solid rgba(200,255,0,.15)" }}>
                    {member.role}
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: "16px 18px 20px" }}>
                  <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{member.name}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".1em", color: G.dim, textTransform: "uppercase" }}>{member.role}</div>
                  {/* Decorative bar */}
                  <div style={{ width: 28, height: 2, background: G.lime, opacity: .3, marginTop: 12 }} />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "140px 24px", borderTop: `1px solid ${G.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(80px,16vw,200px)", color: "rgba(200,255,0,.025)", pointerEvents: "none", userSelect: "none" }}>TRUTH</div>
        <MonoLabel style={{ marginBottom: 18 }}>Open Source Engine</MonoLabel>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(52px,9vw,106px)", lineHeight: .9, marginBottom: 24 }}>THE FAKE ONES<br/>CAN'T HIDE FROM<br/><span style={{ color: G.lime }}>SENTINEL V3.</span></h2>
        <p style={{ fontSize: 15, color: G.dim, maxWidth: 380, margin: "0 auto 48px", lineHeight: 1.7, fontWeight: 300 }}>Start detecting fake reviews instantly. No API keys. No setup. Just truth.</p>
        <button onClick={() => setPage(user ? "analyzer" : "auth")}
          style={{ background: G.lime, color: G.void, padding: "18px 56px", fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", border: "none", cursor: "pointer", clipPath: "polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))" }}>
          {user ? "Open Analyzer →" : "Get Started Free →"}
        </button>
      </section>

      {/* FOOTER */}
      <footer className="sentinel-footer" style={{ borderTop: `1px solid ${G.border}`, padding: "32px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 19, letterSpacing: ".18em", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: G.lime }} />
          SENTINEL V3
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".08em", color: "rgba(240,240,240,.22)" }}>© 2025 Sentinel AI — Powered by BERT</div>
        <div style={{ display: "flex", gap: 22 }}>
          {["Privacy","Terms","API","Contact"].map(l => (
            <a key={l} href="#" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(240,240,240,.25)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
