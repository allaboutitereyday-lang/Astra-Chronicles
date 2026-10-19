"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeSpeed: number;
  color: string;
}

interface AtmosphericParticlesProps {
  location?: string;
  intensity?: "gentle" | "intense";
}

export function AtmosphericParticles({
  location = "Imperial Capital Imperium",
  intensity = "gentle",
}: AtmosphericParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Determine color palette based on location
    const getColors = (loc: string) => {
      const l = loc.toLowerCase();
      if (l.includes("gray zone") || l.includes("demon") || l.includes("volcan")) {
        return ["rgba(239, 68, 68, ", "rgba(249, 115, 22, ", "rgba(245, 158, 11, "]; // Fiery embers
      }
      if (l.includes("estate") || l.includes("bloodrose")) {
        return ["rgba(244, 63, 94, ", "rgba(251, 113, 133, ", "rgba(245, 158, 11, "]; // Rose sparks
      }
      if (l.includes("port") || l.includes("fortus") || l.includes("shadow")) {
        return ["rgba(234, 179, 8, ", "rgba(56, 189, 248, ", "rgba(147, 197, 253, "]; // Gold glints & sea mist
      }
      if (l.includes("vault") || l.includes("archon")) {
        return ["rgba(56, 189, 248, ", "rgba(129, 140, 248, ", "rgba(168, 85, 247, "]; // Azure glyph energy
      }
      // Imperial / Spire / Celestial default
      return ["rgba(96, 165, 250, ", "rgba(192, 132, 252, ", "rgba(244, 114, 182, "]; // Celestial motes
    };

    const colors = getColors(location);
    const particleCount = intensity === "intense" ? 50 : 30;

    const particles: Particle[] = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.45,
      speedY: -(Math.random() * 0.55 + 0.2), // gentle upwards drift
      opacity: Math.random() * 0.7 + 0.2,
      fadeSpeed: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.fadeSpeed;

        if (p.opacity > 0.85 || p.opacity < 0.15) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, Math.min(1, p.opacity))})`;
        ctx.shadowColor = `${p.color}0.8)`;
        ctx.shadowBlur = p.size * 3.5;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [location, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 opacity-70"
    />
  );
}

