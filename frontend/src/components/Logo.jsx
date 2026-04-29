export const G = {
  void: "#03040a",
  lime: "#c8ff00",
  fake: "#ff2d55",
  real: "#00ffb3",
  sus: "#ff9f1c",
  fg: "#f0f0f0",
  dim: "rgba(240,240,240,0.38)",
  glass: "rgba(255,255,255,0.032)",
  border: "rgba(255,255,255,0.07)",
};

export default function Logo({ size = 22 }) {
  return (
    <div
      style={{
        fontFamily: "'Bebas Neue',sans-serif",
        fontSize: size,
        letterSpacing: ".18em",
        display: "flex",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: G.lime,
          animation: "pip 2s ease-in-out infinite",
        }}
      />
      SENTINEL V3
    </div>
  );
}
