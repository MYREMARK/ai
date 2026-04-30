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
            "radial-gradient(circle at 50% 35%, rgba(103,232,249,0.22), transparent 34%), radial-gradient(circle at 12% 20%, rgba(252,211,77,0.16), transparent 28%), linear-gradient(180deg, rgba(2,6,23,0.18), #020617 92%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: 999,
          background: "rgba(103,232,249,0.18)",
          filter: "blur(90px)",
          top: "14%",
          left: "4%",
          transform: `translateY(${scrollY * 0.28}px)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: 999,
          background: "rgba(252,211,77,0.15)",
          filter: "blur(100px)",
          bottom: "8%",
          right: "4%",
          transform: `translateY(${scrollY * 0.12}px)`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100svh",
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.9fr) minmax(420px, 1.1fr)",
          alignItems: "center",
          gap: 24,
          width: "min(1520px, calc(100% - 28px))",
          margin: "0 auto",
          padding: "88px 0 36px",
          textAlign: "left",
        }}
      >
        <div
          style={{
            maxWidth: 700,
          }}
        >
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
              fontSize: "clamp(52px, 8vw, 92px)",
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
              maxWidth: 620,
              color: "#CBD5E1",
              fontSize: "clamp(18px, 2vw, 22px)",
              lineHeight: 1.55,
            }}
          >
            A premium creative AI experience for businesses that want better
            content, sharper branding and faster execution without losing the
            human creative edge.
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
              Book a strategy call
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
              View selected work
            </a>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            minHeight: 760,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "62%",
                aspectRatio: "1 / 1",
                borderRadius: 999,
                background: "rgba(103,232,249,0.12)",
                filter: "blur(70px)",
                left: "52%",
                top: "18%",
                transform: "translateX(-50%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                width: "48%",
                aspectRatio: "1 / 1",
                borderRadius: 999,
                background: "rgba(252,211,77,0.12)",
                filter: "blur(90px)",
                left: "56%",
                bottom: "10%",
                transform: "translateX(-50%)",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              width: "min(100%, 780px)",
              transform: `translateX(-50%) translateY(${scrollY * 0.04}px)`,
            }}
          >
            <div className="characterBreathing">
              <Image
                src="/markCharacter.webp"
                alt="Mark character"
                width={780}
                height={980}
                priority
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  filter: "drop-shadow(0 28px 90px rgba(0,0,0,0.65))",
                }}
              />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 48,
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
        .characterBreathing {
          transform-origin: center bottom;
          animation: breathing 4.8s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes breathing {
          0% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.018);
          }

          100% {
            transform: scale(1);
          }
        }

        @media (max-width: 1100px) {
          section div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
            width: min(100%, calc(100% - 24px)) !important;
            padding-top: 84px !important;
          }
        }

        @media (max-width: 900px) {
          section div[style*="min-height: 760"] {
            min-height: 560px !important;
          }
        }

        @media (max-width: 640px) {
          section div[style*="grid-template-columns"] {
            width: calc(100% - 18px) !important;
          }

          section div[style*="min-height: 760"] {
            min-height: 470px !important;
          }

          section div[style*="max-width: 260px"] {
            right: 0 !important;
            bottom: 18px !important;
            max-width: 200px !important;
            padding: 14px !important;
          }
        }
      `}</style>
    </section>
  )
}