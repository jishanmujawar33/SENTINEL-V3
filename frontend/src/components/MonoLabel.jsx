export default function MonoLabel({ children, style = {} }) {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: 9,
        letterSpacing: ".22em",
        textTransform: "uppercase",
        color: "rgba(200,255,0,.5)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
