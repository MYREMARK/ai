"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export default function PortfolioParallaxHero() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100svh",
        overflow: "hidden",
        backgroundColor: "#020617",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${scrollY * 0.18}px) scale(1.08)`,
          opacity: 0.45,
        }}
      >
        <Image
          src="/portfolioBg.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: "cover",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 35%, rgba(103,232,249,0.22), transparent 34%), radial-gradient(circle at 12% 20%, rgba(252,211,77,0.16), transparent 28%), linear-gradient(180deg, rgba(2,6,23,0.2), #020617 92%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: 999,
          background: "rgba(103,232,249,0.18)",
          filter: "blur(80px)",
          top: "18%",
          left: "8%",
          transform: `translateY(${scrollY * 0.28}px)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 360,
          height: 360,
          borderRadius: 999,
          background: "rgba(252,211,77,0.16)",
          filter: "blur(90px)",
          bottom: "12%",
          right: "8%",
          transform: `translateY(${scrollY * 0.12}px)`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100svh",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.05fr) minmax(280px, 0.95fr)",
          alignItems: "center",
          gap: 40,
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "96px 0 48px",
        }}
      >
        <div>
          <div
            style={{
            display: "inline-flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid rgba(103,232,249,0.32)",
              background: "rgba(255,255,255,0.05)",
              color: "#67E8F9",
              borderRadius: 999,
              padding: "9px 14px",
              fontSize: 14,
              marginBottom: 22,
              backdropFilter: "blur(18px)",
            }}
          >
            ReMark AI Studio
          </div>

          <h1
            style={{
              fontSize: "clamp(48px, 8vw, 86px)",
              lineHeight: 0.92,
              letterSpacing: "0.03em",
              margin: 0,
              maxWidth: 820,
            }}
          >
            Creative AI
            <br />
            that feels like
            <br />
            a real studio
          </h1>

          <p
            style={{
              marginTop: 24,
              maxWidth: 640,
              color: "#CBD5E1",
              fontSize: "clamp(18px, 2.1vw, 22px)",
              lineHeight: 1.55,
            }}
          >
            עמוד השראה בסגנון הפורטפוליו הישן, אבל עם השפה החדשה של ReMark:
            כהה, חד, טכנולוגי, פרימיום, ומכוון לעסקים שרוצים להפיק תוכן עם בינה
            מלאכותית בצורה חכמה יותר.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              marginTop: 32,
            }}
          >
            <a
              href="#contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 54,
                padding: "0 24px",
                borderRadius: 999,
                background: "#67E8F9",
                color: "#020617",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 0 34px rgba(103,232,249,0.35)",
              }}
            >
              קבע לי שיחת אבחון
            </a>

            <a
              href="#projects"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 54,
                padding: "0 24px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "#FFFFFF",
                fontWeight: 700,
                textDecoration: "none",
                backdropFilter: "blur(18px)",
              }}
            >
              לראות פרויקטים
            </a>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            minHeight: 560,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "8% 2% 4% 2%",
              borderRadius: 40,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(22px)",
              boxShadow: "0 30px 100px rgba(0,0,0,0.45)",
              transform: `translateY(${scrollY * 0.08}px)`,
            }}
          />

          <Image
            src="/markCharacter.webp"
            alt="Mark character"
            width={620}
            height={760}
            priority
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              width: "min(100%, 560px)",
              height: "auto",
              transform: `translateX(-50%) translateY(${scrollY * 0.04}px)`,
              filter: "drop-shadow(0 30px 70px rgba(0,0,0,0.6))",
            }}
          />

          <div
            style={{
              position: "absolute",
              right: 8,
              bottom: 40,
              borderRadius: 24,
              padding: 18,
              maxWidth: 260,
              background: "rgba(15,23,42,0.76)",
              border: "1px solid rgba(103,232,249,0.22)",
              color: "#E2E8F0",
              backdropFilter: "blur(18px)",
              transform: `translateY(${scrollY * 0.14}px)`,
            }}
          >
            <strong style={{ color: "#FCD34D" }}>20 plus years</strong>
            <br />
            Marketing design, gaming branding, AI content systems and creative
            workflows.
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          section div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            padding-top: 88px !important;
          }
        }
      `}</style>
    </section>
  )
}