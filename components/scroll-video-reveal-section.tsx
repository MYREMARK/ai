"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type PinState = "before" | "active" | "after";

export function ScrollVideoRevealSection({
  children,
}: {
  children: ReactNode;
}) {
  const desktopSectionRef = useRef<HTMLElement | null>(null);
  const mobileSectionRef = useRef<HTMLElement | null>(null);
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const desktopDurationRef = useRef(0);
  const mobileDurationRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [pinState, setPinState] = useState<PinState>("before");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => {
      window.removeEventListener("resize", checkScreen);
    };
  }, []);

  useEffect(() => {
    const desktopVideo = desktopVideoRef.current;
    const mobileVideo = mobileVideoRef.current;

    const bindMetadata = (
      video: HTMLVideoElement | null,
      durationRef: React.MutableRefObject<number>
    ) => {
      if (!video) return () => {};

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
    };

    const cleanupDesktop = bindMetadata(desktopVideo, desktopDurationRef);
    const cleanupMobile = bindMetadata(mobileVideo, mobileDurationRef);

    return () => {
      cleanupDesktop();
      cleanupMobile();
    };
  }, []);

  useEffect(() => {
    const update = () => {
      rafRef.current = null;

      const section = isMobile ? mobileSectionRef.current : desktopSectionRef.current;
      const video = isMobile ? mobileVideoRef.current : desktopVideoRef.current;
      const durationRef = isMobile ? mobileDurationRef : desktopDurationRef;

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
  }, [isMobile]);

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
    <>
      {/* Desktop */}
      <section
        ref={desktopSectionRef}
        className="relative hidden md:block md:h-[460vh]"
      >
        <div
          aria-hidden="true"
          className="video-top-fade pointer-events-none absolute inset-x-0 top-0 z-20"
        />
        <div className={pinClassName}>
          <div className="relative h-full w-full overflow-hidden bg-slate-950">
            <video
              ref={desktopVideoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="auto"
              aria-label="וידאו רקע מבוקר בגלילה - דסקטופ"
            >
              <source src="/space.mp4" type="video/mp4" />
            </video>

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.03)_18%,rgba(2,6,23,0.18)_68%,rgba(2,6,23,0.52)_100%)]"
              style={{ opacity: overlayOpacity }}
            />

            <div
              aria-hidden="true"
              className="space-stars space-stars-overlay"
              style={{ opacity: 0.9 - textOpacity * 0.5 }}
            />

            <div className="absolute inset-0 z-[2] flex items-center justify-center px-6 py-6 pointer-events-none lg:px-8">
              <div
                className="w-full max-w-6xl transition-[opacity,transform] duration-300 ease-out"
                style={{
                  opacity: textOpacity,
                  transform: `translateY(${textTranslate}px)`,
                }}
              >
                <div className="mx-auto rounded-[36px] border border-white/10 bg-slate-950/72 px-5 py-6 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl lg:px-8 lg:py-7">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile */}
      <section
        ref={mobileSectionRef}
        className="relative h-[190vh] md:hidden"
      >
        <div
          aria-hidden="true"
          className="video-top-fade pointer-events-none absolute inset-x-0 top-0 z-20"
        />
        <div className={pinClassName}>
          <div className="relative h-full w-full overflow-hidden bg-slate-950">
            <video
              ref={mobileVideoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
              aria-label="וידאו רקע מבוקר בגלילה - מובייל"
            >
              <source src="/space-mobile.mp4" type="video/mp4" />
            </video>

            <div aria-hidden="true" className="space-stars space-stars-overlay" />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.03)_18%,rgba(2,6,23,0.18)_68%,rgba(2,6,23,0.52)_100%)]"
              style={{ opacity: overlayOpacity }}
            />
          </div>
        </div>
      </section>

      <section className="section-shell px-4 py-10 md:hidden">{children}</section>
    </>
  );
}