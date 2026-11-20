"use client";

import { useEffect, useState } from "react";
import { getCookieChoice, OPEN_SETTINGS_EVENT, setCookieChoice } from "@/lib/meta-pixel";

type CookieBannerProps = {
  onVisibilityChange?: (visible: boolean) => void;
};

export function CookieBanner({ onVisibilityChange }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = getCookieChoice() === null;
    setVisible(show);
    onVisibilityChange?.(show);

    // The footer link "הגדרות עוגיות" lets the visitor change the choice at any time.
    const reopen = () => {
      setVisible(true);
      onVisibilityChange?.(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, [onVisibilityChange]);

  const choose = (choice: "accepted" | "declined") => {
    setCookieChoice(choice);
    setVisible(false);
    onVisibilityChange?.(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-3 z-[99998] px-3">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="shrink-0 text-3xl">🍪</div>

            <p className="flex-1 text-right text-sm leading-7 text-slate-200">
              בהסכמתך, נשתמש ב-Meta Pixel של חברת Meta למדידה ולהתאמת פרסום. אפשר
              לסרב, והאתר ימשיך לעבוד כרגיל. פרטים ב
              <a
                href="/privacy-policy"
                className="mr-1 text-cyan-300 underline underline-offset-4"
              >
                מדיניות הפרטיות
              </a>
              .
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="flex-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 md:flex-none"
            >
              אישור
            </button>
            <button
              type="button"
              onClick={() => choose("declined")}
              className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 md:flex-none"
            >
              דחייה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
