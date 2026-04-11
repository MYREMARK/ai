"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cookie-banner-accepted";

type CookieBannerProps = {
  onVisibilityChange?: (visible: boolean) => void;
};

export function CookieBanner({ onVisibilityChange }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = window.localStorage.getItem(STORAGE_KEY);
    const shouldShow = !accepted;
    setVisible(shouldShow);
    onVisibilityChange?.(shouldShow);
  }, [onVisibilityChange]);

  const handleAccept = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
    onVisibilityChange?.(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[99998] px-4">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 rounded-3xl border border-white/10 bg-slate-950/90 px-5 py-4 text-center shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:flex-row md:justify-between md:text-right">
        <p className="text-sm leading-7 text-slate-200">
          האתר משתמש בעוגיות קוקיז 🍪 לצורכי תפעול, אנליטיקה, מדידה ופרסום מותאם, בהתאם ל
          <a href="/privacy-policy" className="mr-1 text-cyan-300 underline underline-offset-4">
            מדיניות הפרטיות
          </a>
          .
        </p>

        <button
          type="button"
          onClick={handleAccept}
          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
        >
          הבנתי
        </button>
      </div>
    </div>
  );
}