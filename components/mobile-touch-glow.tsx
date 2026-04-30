"use client"

import { useEffect, useRef, useState } from "react"

export default function MobileTouchGlow() {
  const glowRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const positionRef = useRef({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0

    if (!isTouchDevice) return

    const moveGlow = () => {
      const glow = glowRef.current
      if (!glow) return

      const size = 260
      const x = positionRef.current.x
      const y = positionRef.current.y

      glow.style.transform = `translate3d(${x - size / 2}px, ${
        y - size / 2
      }px, 0)`

      frameRef.current = null
    }

    const updatePosition = (x: number, y: number) => {
      positionRef.current = { x, y }

      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(moveGlow)
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return

      updatePosition(touch.clientX, touch.clientY)
      setIsVisible(true)
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return

      updatePosition(touch.clientX, touch.clientY)
      setIsVisible(true)
    }

    const handleTouchEnd = () => {
      setIsVisible(false)
    }

    const handleTouchCancel = () => {
      setIsVisible(false)
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd, { passive: true })
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true })

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("touchcancel", handleTouchCancel)

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 260,
        height: 260,
        borderRadius: 999,
        pointerEvents: "none",
        zIndex: 40,
        opacity: isVisible ? 1 : 0,
        transition: "opacity 220ms ease",
        background:
          "radial-gradient(circle, rgba(103,232,249,0.28) 0%, rgba(252,211,77,0.12) 34%, rgba(103,232,249,0.04) 58%, transparent 72%)",
        filter: "blur(16px)",
        mixBlendMode: "screen",
        willChange: "transform, opacity",
      }}
    />
  )
}