import { useState, useEffect } from "react";
import { G } from "./components/Logo";
import Nav from "./components/Nav";
import DustCanvas from "./components/DustCanvas";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import AnalyzerPage from "./pages/AnalyzerPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);

  // Check existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("sentinel_token");
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setUser(data.user))
        .catch(() => {
          // Token expired or backend offline — check for demo user
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.id === "demo-user") {
              setUser({ id: "demo-user", email: "demo@sentinel.ai", name: "Demo User" });
            } else {
              localStorage.removeItem("sentinel_token");
            }
          } catch {
            localStorage.removeItem("sentinel_token");
          }
        });
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("sentinel_token");
    localStorage.removeItem("sentinel_remember");
    setUser(null);
    setPage("home");
  };

  const demoLogin = () => {
    setUser({ email: "demo@sentinel.ai", id: "demo-user", name: "Demo User" });
    setPage("analyzer");
  };

  return (
    <div style={{ background: G.void, minHeight: "100vh", position: "relative" }}>
      <DustCanvas />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Nav page={page} setPage={setPage} user={user} onLogout={logout} />
        {page === "home" && <HomePage setPage={setPage} user={user} />}
        {page === "auth" && <AuthPage setUser={setUser} setPage={setPage} onDemoLogin={demoLogin} />}
        {page === "analyzer" && <AnalyzerPage user={user} setPage={setPage} />}
        {page === "history" && <HistoryPage user={user} setPage={setPage} />}
      </div>
    </div>
  );
}
