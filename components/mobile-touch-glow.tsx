"use client";

import { useEffect, useRef, useState } from "react";

type Point = {
  x: number;
  y: number;
};

export function MobileTouchGlow() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [point, setPoint] = useState<Point>({ x: 0, y: 0 });
  const [trail1, setTrail1] = useState<Point>({ x: 0, y: 0 });
  const [trail2, setTrail2] = useState<Point>({ x: 0, y: 0 });

  const hideTimeoutRef = useRef<number | null>(null);

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

    const clearHideTimeout = () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const scheduleHide = (delay = 650) => {
      clearHideTimeout();
      hideTimeoutRef.current = window.setTimeout(() => {
        setActive(false);
      }, delay);
    };

    const updatePoint = (x: number, y: number) => {
      setTrail2(trail1);
      setTrail1(point);
      setPoint({ x, y });
      setActive(true);
      scheduleHide(650);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      updatePoint(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      updatePoint(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      scheduleHide(480);
    };

    const handleTouchCancel = () => {
      scheduleHide(480);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
      clearHideTimeout();
    };
  }, [enabled, point, trail1]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[99997] overflow-hidden"
    >
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[opacity,transform,left,top] duration-500 ease-out"
        style={{
          left: trail2.x,
          top: trail2.y,
          width: 300,
          height: 300,
          opacity: active ? 0.18 : 0,
          transform: `translate(-50%, -50%) scale(${active ? 1 : 0.88})`,
          background:
            "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0.10) 28%, rgba(56,189,248,0.04) 52%, transparent 76%)",
          filter: "blur(20px)",
        }}
      />

      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[opacity,transform,left,top] duration-400 ease-out"
        style={{
          left: trail1.x,
          top: trail1.y,
          width: 320,
          height: 320,
          opacity: active ? 0.32 : 0,
          transform: `translate(-50%, -50%) scale(${active ? 1 : 0.9})`,
          background:
            "radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(56,189,248,0.16) 26%, rgba(56,189,248,0.08) 46%, transparent 74%)",
          filter: "blur(18px)",
        }}
      />

      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[opacity,transform,left,top] duration-300 ease-out"
        style={{
          left: point.x,
          top: point.y,
          width: 420,
          height: 420,
          opacity: active ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${active ? 1 : 0.9})`,
          background:
            "radial-gradient(circle, rgba(56,189,248,0.46) 0%, rgba(56,189,248,0.30) 20%, rgba(56,189,248,0.16) 40%, rgba(56,189,248,0.08) 56%, transparent 78%)",
          filter: "blur(18px)",
        }}
      />
    </div>
  );
}