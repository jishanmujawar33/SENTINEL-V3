import { useState } from "react";
import Logo, { G } from "./Logo";

export default function Nav({ page, setPage, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navTo = (p) => {
    setPage(p);
    setMenuOpen(false);
  };

  return (
    <nav
      className="sentinel-nav"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        background: "linear-gradient(to bottom,rgba(3,4,10,.98),transparent)",
      }}
    >
      <div onClick={() => navTo("home")} style={{ cursor: "pointer" }}>
        <Logo />
      </div>

      {/* Hamburger button — hidden on desktop via inline style, shown on mobile via CSS */}
      <button
        className="sentinel-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: "none",
          flexDirection: "column",
          gap: 5,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          zIndex: 1001,
        }}
        aria-label="Toggle menu"
      >
        <div style={{ width: 22, height: 2, background: menuOpen ? G.lime : G.fg, transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none", transition: "all .3s" }} />
        <div style={{ width: 22, height: 2, background: G.fg, opacity: menuOpen ? 0 : 1, transition: "all .3s" }} />
        <div style={{ width: 22, height: 2, background: menuOpen ? G.lime : G.fg, transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none", transition: "all .3s" }} />
      </button>

      <div className={`sentinel-nav-links${menuOpen ? " open" : ""}`} style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {["analyzer", "history"].map((p) => (
          <button
            key={p}
            onClick={() => navTo(p)}
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: page === p ? G.lime : G.dim,
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "color .2s",
            }}
          >
            {p === "analyzer" ? "Analyzer" : "History"}
          </button>
        ))}

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexDirection: menuOpen ? "column" : "row" }}>
            <span
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10,
                color: G.dim,
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name || user.email}
            </span>
            <button
              onClick={() => { onLogout(); setMenuOpen(false); }}
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                border: `1px solid ${G.border}`,
                color: G.dim,
                background: "transparent",
                padding: "8px 16px",
                cursor: "pointer",
                borderRadius: 4,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "rgba(200,255,0,.3)";
                e.currentTarget.style.color = G.lime;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = G.border;
                e.currentTarget.style.color = G.dim;
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => navTo("auth")}
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              border: `1px solid rgba(200,255,0,.35)`,
              color: G.lime,
              background: "transparent",
              padding: "10px 22px",
              cursor: "pointer",
              borderRadius: 4,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(200,255,0,.08)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
