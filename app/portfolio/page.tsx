import PortfolioParallaxHero from "@/components/portfolioParallaxHero"

const services = [
  {
    title: "AI Content Studio",
    text: "A practical content system for creating ideas, posts, visuals, videos and marketing copy in your brand voice.",
  },
  {
    title: "Creative Direction",
    text: "A strategic bridge between branding, copywriting, design, visual storytelling and performance focused marketing.",
  },
  {
    title: "Gaming Style Branding",
    text: "Bold, memorable and high impact visual systems inspired by gaming, digital products and premium campaign design.",
  },
  {
    title: "AI Training",
    text: "Private hands on AI training that teaches you how to actually use the tools inside your daily business workflow.",
  },
]

const projects = [
  "Gaming Promo Logos",
  "AI Landing Pages",
  "Brand Characters",
  "Video Ads",
  "Social Campaigns",
  "Creative Systems",
]

const clients = ["Playtika", "InfiApps", "Netcraft", "ReMark", "Studio Clients"]

const testimonials = [
  {
    quote:
      "Mark took a messy idea and turned it into a clear, sharp and marketable creative direction. It felt like having a full studio behind the project.",
    name: "Business Client",
  },
  {
    quote:
      "The combination of design, marketing and AI saved me hours of work and gave my business a completely new content direction.",
    name: "Independent Business Owner",
  },
]

export default function PortfolioPage() {
  return (
    <main
      dir="ltr"
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <PortfolioParallaxHero />

      <section
        style={{
          width: "min(1520px, calc(100% - 28px))",
          margin: "0 auto",
          padding: "72px 0",
          textAlign: "left",
        }}
      >
        <p
          style={{
            color: "#67E8F9",
            fontSize: 14,
            marginBottom: 14,
            letterSpacing: "0.16em",
          }}
        >
          WHO THIS IS FOR
        </p>

        <h2
          style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            lineHeight: 1,
            margin: 0,
            maxWidth: 860,
          }}
        >
          Not another portfolio.
          <br />
          A premium creative system built for the AI era.
        </h2>

        <p
          style={{
            color: "#CBD5E1",
            fontSize: 20,
            lineHeight: 1.7,
            maxWidth: 760,
            marginTop: 24,
          }}
        >
          This page takes the structure of the original ReMark portfolio and
          upgrades it into a sharper, darker and more premium AI driven brand
          experience.
        </p>
      </section>

      <section
        style={{
          width: "min(1520px, calc(100% - 28px))",
          margin: "0 auto",
          padding: "24px 0 72px",
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 18,
        }}
      >
        {services.map((item) => (
          <article
            key={item.title}
            style={{
              borderRadius: 28,
              padding: 30,
              minHeight: 240,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 70px rgba(0,0,0,0.28)",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#F8FAFC",
                fontSize: 24,
                lineHeight: 1.1,
              }}
            >
              {item.title}
            </h3>

            <p
              style={{
                color: "#CBD5E1",
                fontSize: 17,
                lineHeight: 1.65,
                marginTop: 16,
              }}
            >
              {item.text}
            </p>
          </article>
        ))}
      </section>

      <section
        id="projects"
        style={{
          width: "min(1520px, calc(100% - 28px))",
          margin: "0 auto",
          padding: "72px 0",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div>
            <p
              style={{
                color: "#67E8F9",
                fontSize: 14,
                marginBottom: 14,
                letterSpacing: "0.16em",
              }}
            >
              SELECTED WORK
            </p>

            <h2
              style={{
                fontSize: "clamp(40px, 6vw, 64px)",
                lineHeight: 1,
                margin: 0,
              }}
            >
              Projects that feel
              <br />
              like a brand, not a template.
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 18,
          }}
        >
          {projects.map((project, index) => (
            <article
              key={project}
              style={{
                position: "relative",
                minHeight: 260,
                overflow: "hidden",
                borderRadius: 30,
                background:
                  index % 2 === 0
                    ? "linear-gradient(135deg, rgba(103,232,249,0.18), rgba(255,255,255,0.05))"
                    : "linear-gradient(135deg, rgba(252,211,77,0.16), rgba(255,255,255,0.05))",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: 30,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 180,
                  height: 180,
                  borderRadius: 999,
                  background:
                    index % 2 === 0
                      ? "rgba(103,232,249,0.26)"
                      : "rgba(252,211,77,0.22)",
                  filter: "blur(46px)",
                  right: 24,
                  bottom: 12,
                }}
              />

              <p
                style={{
                  position: "relative",
                  color: "#94A3B8",
                  fontSize: 14,
                  margin: 0,
                }}
              >
                Project 0{index + 1}
              </p>

              <h3
                style={{
                  position: "relative",
                  margin: "110px 0 0",
                  fontSize: 30,
                  lineHeight: 1.05,
                }}
              >
                {project}
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          width: "min(1520px, calc(100% - 28px))",
          margin: "0 auto",
          padding: "72px 0",
          textAlign: "left",
        }}
      >
        <p
          style={{
            color: "#67E8F9",
            fontSize: 14,
            marginBottom: 14,
            letterSpacing: "0.16em",
          }}
        >
          TRUSTED BY
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          {clients.map((client) => (
            <div
              key={client}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "#E2E8F0",
                padding: "14px 20px",
                fontSize: 18,
              }}
            >
              {client}
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          width: "min(1520px, calc(100% - 28px))",
          margin: "0 auto",
          padding: "72px 0",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 18,
        }}
      >
        {testimonials.map((item) => (
          <article
            key={item.name}
            style={{
              borderRadius: 32,
              padding: 28,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <p
              style={{
                fontSize: 22,
                lineHeight: 1.65,
                color: "#F8FAFC",
                margin: 0,
              }}
            >
              “{item.quote}”
            </p>

            <p
              style={{
                color: "#FCD34D",
                fontSize: 16,
                marginTop: 18,
              }}
            >
              {item.name}
            </p>
          </article>
        ))}
      </section>

      <section
        id="contact"
        style={{
          width: "min(1400px, calc(100% - 28px))",
          margin: "0 auto",
          padding: "72px 0 110px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#67E8F9",
            fontSize: 14,
            marginBottom: 14,
            letterSpacing: "0.16em",
          }}
        >
          READY WHEN YOU ARE
        </p>

        <h2
          style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            lineHeight: 1,
            margin: 0,
          }}
        >
          Want to turn your business
          <br />
          into a smarter content machine?
        </h2>

        <p
          style={{
            color: "#CBD5E1",
            fontSize: 20,
            lineHeight: 1.7,
            maxWidth: 680,
            margin: "24px auto 0",
          }}
        >
          This page can connect to your existing contact form, floating CTA and
          email delivery flow that already works through nodemailer.
        </p>

        <a
          href="/#contact"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 58,
            marginTop: 32,
            padding: "0 28px",
            borderRadius: 999,
            background: "#67E8F9",
            color: "#020617",
            fontWeight: 900,
            textDecoration: "none",
            boxShadow: "0 0 38px rgba(103,232,249,0.38)",
          }}
        >
          Book a free strategy call
        </a>
      </section>

      <style>{`
        @media (max-width: 900px) {
          section[style*="repeat(4"] {
            grid-template-columns: 1fr !important;
          }

          section[style*="repeat(3"] {
            grid-template-columns: 1fr !important;
          }

          section[style*="repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}