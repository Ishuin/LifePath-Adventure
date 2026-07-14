"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative animated "constellation" canvas background (ported from the
 * original landing page). Fixed, behind content, hidden from assistive tech,
 * and disabled when the user prefers reduced motion.
 */
export default function ConstellationBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const numPoints = 30;
    const connectionDistance = 150;
    const points = Array.from({ length: numPoints }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(76, 175, 80, 0.5)";
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          if (Math.hypot(dx, dy) < connectionDistance) {
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
          }
        }
      }
      ctx.stroke();
    };

    let raf = 0;
    const animate = () => {
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          p.x -= dx * force * 0.05;
          p.y -= dy * force * 0.05;
        }
      }
      draw();
      raf = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    if (prefersReduced) {
      draw(); // one static frame, no animation loop or mouse listener
    } else {
      document.addEventListener("mousemove", handleMouseMove);
      animate();
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10"
      style={{
        background:
          "linear-gradient(135deg, #050a19, #1a237e, #050a19)",
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
