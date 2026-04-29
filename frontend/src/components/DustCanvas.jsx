import { useEffect, useRef } from "react";

export default function DustCanvas() {
  const ref = useRef();

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    let CW, CH, af;

    const resize = () => {
      CW = cv.width = window.innerWidth;
      CH = cv.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 0.8 + 0.2,
      a: Math.random() * 0.4 + 0.05,
      speed: Math.random() * 0.07 + 0.01,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, CW, CH);
      stars.forEach((s) => {
        s.y -= s.speed;
        if (s.y < -4) {
          s.y = CH + 4;
          s.x = Math.random() * CW;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,255,0,${s.a})`;
        ctx.fill();
      });
      af = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(af);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
