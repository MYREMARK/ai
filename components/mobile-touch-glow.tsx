"use client";

import { useEffect, useState } from "react";

export function MobileTouchGlow() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [point, setPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setEnabled(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let hideTimeout: number | null = null;

    const showAt = (x: number, y: number) => {
      setPoint({ x, y });
      setVisible(true);

      if (hideTimeout) {
        window.clearTimeout(hideTimeout);
      }

      hideTimeout = window.setTimeout(() => {
        setVisible(false);
      }, 180);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      showAt(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      showAt(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      if (hideTimeout) {
        window.clearTimeout(hideTimeout);
      }

      hideTimeout = window.setTimeout(() => {
        setVisible(false);
      }, 120);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      if (hideTimeout) {
        window.clearTimeout(hideTimeout);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[opacity,transform] duration-200 ease-out"
        style={{
          left: point.x,
          top: point.y,
          width: 300,
            height: 300,
          opacity: visible ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.72})`,
          background:
            "radial-gradient(circle, rgba(56,189,248,0.38) 0%, rgba(56,189,248,0.16) 26%, rgba(56,189,248,0.08) 46%, rgba(56,189,248,0.03) 62%, transparent 76%)",
          filter: "blur(12px)",
        }}
      />
    </div>
  );
}