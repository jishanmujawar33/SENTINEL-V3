import { G } from "./Logo";

export default function GlassCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: "rgba(10,12,20,0.85)",
        border: `1px solid ${G.border}`,
        borderRadius: 10,
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
