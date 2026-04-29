import { G } from "./Logo";

const cfgMap = {
  FAKE: { bg: "rgba(255,45,85,.15)", color: G.fake, border: "rgba(255,45,85,.3)", icon: "⚠", label: "FAKE" },
  GENUINE: { bg: "rgba(0,255,179,.1)", color: G.real, border: "rgba(0,255,179,.25)", icon: "✓", label: "GENUINE" },
  SUSPICIOUS: { bg: "rgba(255,159,28,.1)", color: G.sus, border: "rgba(255,159,28,.25)", icon: "?", label: "SUSPICIOUS" },
};

export default function Badge({ verdict }) {
  const cfg = cfgMap[verdict] || {
    bg: "rgba(255,255,255,.05)",
    color: G.dim,
    border: G.border,
    icon: "·",
    label: verdict,
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: 10,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        padding: "5px 11px",
        borderRadius: 4,
        fontWeight: 500,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}
