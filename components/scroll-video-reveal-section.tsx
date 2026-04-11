"use client";

import { useEffect, useRef, useState } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type LearningTrack = {
  title: string;
  text: string;
};

type PinState = "before" | "active" | "after";

export function ScrollVideoRevealSection({
  tracks,
}: {
  tracks: LearningTrack[];
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const durationRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [pinState, setPinState] = useState<PinState>("before");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMetadata = () => {
      durationRef.current = Number.isFinite(video.duration) ? video.duration : 0;
      video.pause();
      video.currentTime = 0;
    };

    if (video.readyState >= 1) {
      handleMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleMetadata);
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      rafRef.current = null;
      const section = sectionRef.current;
      const video = videoRef.current;
      if (!section || !video) return;

      const viewport = window.innerHeight || 1;
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const pinStart = sectionTop;
      const pinEnd = sectionTop + sectionHeight - viewport;
      const scrollY = window.scrollY;

      let nextPinState: PinState = "before";
      if (scrollY >= pinStart && scrollY <= pinEnd) nextPinState = "active";
      else if (scrollY > pinEnd) nextPinState = "after";
      setPinState(nextPinState);

      const maxScroll = Math.max(pinEnd - pinStart, 1);
      const rawScroll = scrollY - pinStart;
      const clampedScroll = clamp(rawScroll, 0, maxScroll);
      const nextProgress = clamp(clampedScroll / maxScroll, 0, 1);
      setProgress(nextProgress);

      const duration = durationRef.current || video.duration || 0;
      if (duration > 0) {
        const videoProgress = clamp(nextProgress / 0.74, 0, 1);
        const targetTime = clamp(
          videoProgress * duration,
          0,
          Math.max(duration - 0.01, 0)
        );

        if (Math.abs(video.currentTime - targetTime) > 0.02) {
          video.currentTime = targetTime;
        }
      }
    };

    const requestUpdate = () => {
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const textOpacity = clamp((progress - 0.7) / 0.16, 0, 1);
  const textTranslate = 48 - textOpacity * 48;
  const overlayOpacity = 0.08 + textOpacity * 0.42;

  const pinClassName =
    pinState === "active"
      ? "fixed inset-x-0 top-0 h-screen"
      : pinState === "after"
      ? "absolute inset-x-0 bottom-0 h-screen"
      : "absolute inset-x-0 top-0 h-screen";

  return (
    <section ref={sectionRef} className="relative h-[260vh] md:h-[460vh]">
      <div className={pinClassName}>
        <div className="relative h-full w-full overflow-hidden bg-slate-950">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="auto"
            aria-label="וידאו רקע מבוקר בגלילה"
          >
            <source src="/space.mp4" type="video/mp4" />
          </video>

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.03)_18%,rgba(2,6,23,0.18)_68%,rgba(2,6,23,0.52)_100%)]"
            style={{ opacity: overlayOpacity }}
          />

          <div className="absolute inset-0 overflow-y-auto md:overflow-hidden">
            <div className="min-h-full flex items-start justify-center px-4 pt-6 pb-6 md:items-end md:px-8 md:pb-16 pointer-events-none">
              <div
                className="w-full max-w-6xl transition-[opacity,transform] duration-300 ease-out"
                style={{
                  opacity: textOpacity,
                  transform: `translateY(${textTranslate}px)`,
                }}
              >
                <div className="mx-auto max-w-5xl rounded-[34px] border border-white/10 bg-slate-950/72 px-4 py-5 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl md:rounded-[40px] md:px-10 md:py-10">
                  <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                    מה נלמד בפועל
                  </div>

                  <h2 className="mt-5 text-[1.9rem] font-semibold leading-[1.08] text-white md:mt-6 md:text-[3rem] lg:text-[3.2rem]">
                    ארכיטקטורת ה-AI שניישם בעסק שלך
                  </h2>

                  <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-200 md:mt-5 md:text-lg md:leading-8">
                    התהליך הזה לא בנוי לטריקים מגניבים ולא לעוד רשימת כלים
                    מבלבלת. אנחנו בונים תשתית עבודה חכמה לעצמאי שמחזיק את העסק
                    על הכתפיים שלו, כדי לחתוך עלויות, לקצר זמני הפקה ולהוציא
                    יותר תוכן בפחות מאמץ.
                  </p>

                  <div className="mt-6 grid gap-4 md:mt-8 md:gap-5 md:grid-cols-2">
                    {tracks.map((track, index) => (
                      <div
                        key={track.title}
                        className="rounded-[26px] border border-white/10 bg-white/5 p-4 shadow-[0_18px_55px_rgba(2,6,23,0.24)] backdrop-blur-xl md:rounded-[30px] md:p-6"
                        style={{
                          opacity: textOpacity,
                          transform: `translateY(${Math.max(
                            0,
                            18 - textOpacity * 18 + index * 2
                          )}px)`,
                        }}
                      >
                        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-200">
                          {track.title}
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-200 md:text-base md:leading-8">
                          {track.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}