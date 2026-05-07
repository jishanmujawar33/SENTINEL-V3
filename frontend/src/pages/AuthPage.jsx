import { useState, useEffect, useRef } from "react";
import Logo, { G } from "../components/Logo";
import GlassCard from "../components/GlassCard";

const API = "/api/auth";

// ──────────────────────────────────────────────────────────────
// REPLACE with your actual Google OAuth Client ID from
// https://console.cloud.google.com/ → APIs & Services → Credentials
// ──────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = "921008425465-adl2agf32qu6rn3ckj9m0nj7ussokh8s.apps.googleusercontent.com";

/* Password strength calculator */
function getStrength(pass) {
  if (!pass) return { level: 0, label: "", color: "transparent" };
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 10) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (score <= 1) return { level: 1, label: "Weak", color: G.fake };
  if (score <= 3) return { level: 2, label: "Medium", color: G.sus };
  return { level: 3, label: "Strong", color: G.real };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Load Google Identity Services script once */
function loadGoogleScript() {
  if (document.getElementById("google-gsi-script")) return;
  const script = document.createElement("script");
  script.id = "google-gsi-script";
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export default function AuthPage({ setUser, setPage, onDemoLogin }) {
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePass, setShakePass] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => { setError(""); setSuccess(""); }, [mode]);

  // Load Google Identity Services and render button
  useEffect(() => {
    loadGoogleScript();
    const tryInit = () => {
      if (!window.google || !googleBtnRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          width: googleBtnRef.current.offsetWidth || 396,
          text: "continue_with",
          shape: "rectangular",
        });
      } catch { /* GSI not ready yet */ }
    };
    // Retry until GSI script loads
    const interval = setInterval(() => {
      if (window.google) { tryInit(); clearInterval(interval); }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    setError("");
    try {
      // Decode the JWT to extract user info (no secret needed — it's a public JWT)
      const payload = JSON.parse(atob(response.credential.split(".")[1]));
      const googleUser = {
        id: `google-${payload.sub}`,
        name: payload.name || payload.email,
        email: payload.email,
        avatar: payload.picture,
        provider: "google",
      };
      // Store a simple session token using the Google JWT (valid for ~1 hour)
      localStorage.setItem("sentinel_token", response.credential);
      localStorage.setItem("sentinel_google_user", JSON.stringify(googleUser));
      setUser(googleUser);
      setPage("analyzer");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const strength = getStrength(pass);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(""); setSuccess("");

    if (mode === "forgot") {
      if (!email || !isValidEmail(email)) {
        setShakeEmail(true);
        setTimeout(() => setShakeEmail(false), 500);
        return setError("Please enter a valid email address");
      }
      setSuccess("If an account exists with this email, you'll receive reset instructions.");
      return;
    }

    if (mode === "signup" && !name.trim()) return setError("Please enter your full name");
    if (!email || !isValidEmail(email)) {
      setShakeEmail(true);
      setTimeout(() => setShakeEmail(false), 500);
      return setError("Please enter a valid email address");
    }
    if (!pass || pass.length < 6) {
      setShakePass(true);
      setTimeout(() => setShakePass(false), 500);
      return setError("Password must be at least 6 characters");
    }
    if (mode === "signup" && !agreeTerms) return setError("Please agree to the Terms & Privacy Policy");

    setLoading(true);
    try {
      const endpoint = mode === "signin" ? `${API}/login` : `${API}/register`;
      const body = mode === "signin"
        ? { email, password: pass }
        : { name: name.trim(), email, password: pass };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Authentication failed"); setLoading(false); return; }

      localStorage.setItem("sentinel_token", data.token);
      if (remember) localStorage.setItem("sentinel_remember", "true");
      setUser(data.user);
      setPage("analyzer");
    } catch {
      setError("Cannot reach server. Make sure the backend is running on port 3001.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/demo`, { method: "POST" });
      const data = await res.json();
      localStorage.setItem("sentinel_token", data.token);
      setUser(data.user);
      setPage("analyzer");
    } catch {
      if (onDemoLogin) onDemoLogin();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (shake) => ({
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,.04)",
    border: `1px solid ${G.border}`,
    color: G.fg,
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 14,
    borderRadius: 8,
    outline: "none",
    transition: "border .2s, box-shadow .2s",
    animation: shake ? "shakeX .5s ease" : "none",
    boxSizing: "border-box",
  });

  const titles    = { signin: "WELCOME BACK",   signup: "JOIN SENTINEL",       forgot: "RESET PASSWORD" };
  const subtitles = { signin: "Sign in to access your scan history & dashboard.", signup: "Create your free account to start detecting fake reviews.", forgot: "Enter your email and we'll send reset instructions." };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px 60px", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(80px,16vw,180px)", color: "rgba(200,255,0,.018)", pointerEvents: "none", userSelect: "none", zIndex: 0 }}>TRUTH</div>

      <div className="anim-upIn" style={{ width: "100%", maxWidth: 460, zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Logo size={20} />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, lineHeight: 1, marginTop: 24, marginBottom: 8 }}>{titles[mode]}</div>
          <p style={{ fontSize: 13, color: G.dim, fontWeight: 300 }}>{subtitles[mode]}</p>
        </div>

        <GlassCard style={{ padding: "36px 32px" }}>
          {/* Tab Switcher */}
          {mode !== "forgot" && (
            <div style={{ display: "flex", marginBottom: 28, background: "rgba(255,255,255,.03)", borderRadius: 8, padding: 3 }}>
              {["signin", "signup"].map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ flex: 1, padding: "11px 0", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", background: mode === m ? "rgba(200,255,0,.12)" : "transparent", color: mode === m ? G.lime : G.dim, border: mode === m ? "1px solid rgba(200,255,0,.2)" : "1px solid transparent", borderRadius: 6, cursor: "pointer", transition: "all .25s" }}>
                  {m === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name (signup only) */}
            {mode === "signup" && (
              <div className="anim-slideDown">
                <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(200,255,0,.4)", marginBottom: 6, display: "block" }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" autoComplete="name"
                  style={inputStyle(false)}
                  onFocus={e => e.target.style.borderColor = "rgba(200,255,0,.35)"}
                  onBlur={e => e.target.style.borderColor = G.border} />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(200,255,0,.4)", marginBottom: 6, display: "block" }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" autoComplete="email"
                style={inputStyle(shakeEmail)}
                onFocus={e => e.target.style.borderColor = "rgba(200,255,0,.35)"}
                onBlur={e => e.target.style.borderColor = G.border} />
            </div>

            {/* Password */}
            {mode !== "forgot" && (
              <div>
                <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(200,255,0,.4)", marginBottom: 6, display: "block" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input value={pass} onChange={e => setPass(e.target.value)}
                    type={showPass ? "text" : "password"} placeholder="Min 6 characters"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    style={{ ...inputStyle(shakePass), paddingRight: 44 }}
                    onFocus={e => e.target.style.borderColor = "rgba(200,255,0,.35)"}
                    onBlur={e => e.target.style.borderColor = G.border} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: G.dim, cursor: "pointer", fontSize: 14, padding: 4 }}>
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
                {mode === "signup" && pass && (
                  <div className="anim-fadeIn" style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1,2,3].map(l => <div key={l} style={{ flex: 1, height: 3, borderRadius: 2, background: strength.level >= l ? strength.color : "rgba(255,255,255,.08)", transition: "background .3s" }} />)}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".1em", color: strength.color }}>{strength.label}</div>
                  </div>
                )}
              </div>
            )}

            {/* Remember / Forgot */}
            {mode === "signin" && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <div onClick={() => setRemember(!remember)}
                    style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${remember ? "rgba(200,255,0,.5)" : G.border}`, background: remember ? "rgba(200,255,0,.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", cursor: "pointer", fontSize: 10, color: G.lime }}>
                    {remember && "✓"}
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: G.dim, letterSpacing: ".06em" }}>Remember me</span>
                </label>
                <button type="button" onClick={() => setMode("forgot")}
                  style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "rgba(200,255,0,.5)", background: "none", border: "none", cursor: "pointer", letterSpacing: ".06em" }}>
                  Forgot password?
                </button>
              </div>
            )}

            {/* Terms (signup only) */}
            {mode === "signup" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                <div onClick={() => setAgreeTerms(!agreeTerms)}
                  style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${agreeTerms ? "rgba(200,255,0,.5)" : G.border}`, background: agreeTerms ? "rgba(200,255,0,.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", cursor: "pointer", fontSize: 10, color: G.lime, flexShrink: 0, marginTop: 2 }}>
                  {agreeTerms && "✓"}
                </div>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: G.dim, letterSpacing: ".04em", lineHeight: 1.5 }}>
                  I agree to the <span style={{ color: "rgba(200,255,0,.6)", textDecoration: "underline" }}>Terms of Service</span> and <span style={{ color: "rgba(200,255,0,.6)", textDecoration: "underline" }}>Privacy Policy</span>
                </span>
              </label>
            )}

            {/* Error / Success */}
            {error && (
              <div className="anim-slideDown" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: G.fake, letterSpacing: ".04em", padding: "10px 14px", background: "rgba(255,45,85,.08)", border: "1px solid rgba(255,45,85,.2)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚠</span> {error}
              </div>
            )}
            {success && (
              <div className="anim-slideDown" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: G.real, letterSpacing: ".04em", padding: "10px 14px", background: "rgba(0,255,179,.08)", border: "1px solid rgba(0,255,179,.2)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span>✓</span> {success}
              </div>
            )}

            {/* Submit button */}
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "15px", background: loading ? "rgba(200,255,0,.5)" : G.lime, color: G.void, fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", border: "none", borderRadius: 8, cursor: loading ? "default" : "pointer", marginTop: 4, transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.background = "#d4ff1e"; }}
              onMouseOut={e => { if (!loading) e.currentTarget.style.background = G.lime; }}>
              {loading && <div style={{ width: 14, height: 14, border: `2px solid ${G.void}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />}
              {loading ? "Processing..." : mode === "signin" ? "Sign In →" : mode === "signup" ? "Create Account →" : "Send Reset Link →"}
            </button>
          </form>

          {/* Divider + Google + Demo */}
          {mode !== "forgot" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 16px" }}>
                <div style={{ flex: 1, height: 1, background: G.border }} />
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".18em", color: "rgba(240,240,240,.2)", textTransform: "uppercase" }}>or</span>
                <div style={{ flex: 1, height: 1, background: G.border }} />
              </div>

              {/* ── Google Sign-In Button ── */}
              {GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" ? (
                <div style={{ marginBottom: 12 }}>
                  {googleLoading ? (
                    <div style={{ width: "100%", padding: "13px", background: "rgba(255,255,255,.04)", border: `1px solid ${G.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: G.dim, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>
                      <div style={{ width: 14, height: 14, border: "2px solid rgba(200,255,0,.4)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                      Signing in with Google...
                    </div>
                  ) : (
                    <div ref={googleBtnRef} style={{ width: "100%", minHeight: 44, borderRadius: 8, overflow: "hidden" }} />
                  )}
                </div>
              ) : (
                /* Placeholder shown when Client ID not yet configured */
                <button disabled
                  title="Set your GOOGLE_CLIENT_ID in AuthPage.jsx to enable Google Sign-In"
                  style={{ width: "100%", padding: "13px", marginBottom: 12, background: "rgba(255,255,255,.03)", color: "rgba(240,240,240,.3)", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", border: `1px solid ${G.border}`, borderRadius: 8, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,.2)"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,.2)"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="rgba(255,255,255,.2)"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,.2)"/>
                  </svg>
                  Continue with Google (Configure Client ID)
                </button>
              )}

              {/* Demo Login */}
              <button onClick={handleDemoLogin} disabled={loading}
                style={{ width: "100%", padding: "13px", background: "transparent", color: G.dim, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", border: `1px dashed ${G.border}`, borderRadius: 8, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(200,255,0,.3)"; e.currentTarget.style.color = G.lime; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.dim; }}>
                ⚡ Demo Login — No Account Needed
              </button>
            </>
          )}
        </GlassCard>

        {/* Bottom switcher */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          {mode === "forgot" ? (
            <button onClick={() => setMode("signin")} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: G.dim, background: "none", border: "none", cursor: "pointer", letterSpacing: ".06em" }}>
              ← Back to Sign In
            </button>
          ) : (
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: G.dim, background: "none", border: "none", cursor: "pointer", letterSpacing: ".06em" }}>
              {mode === "signin" ? "No account? Sign up free →" : "Already have one? Sign in →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
