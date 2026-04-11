"use client";

import { useEffect, useState } from "react";

export function InteractiveGlow() {
  const [pos, setPos] = useState({ x: 50, y: 20 });

  useEffect(() => {
    const move = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      setPos({ x, y });
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden md:block"
      style={{
        background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(56,189,248,0.12), transparent 14%)`,
      }}
    />
  );
}