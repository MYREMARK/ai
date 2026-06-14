"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ThankYouPage() {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Lead");
    }
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <section className="max-w-2xl text-center">
        <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-white/70">
          הפרטים התקבלו בהצלחה
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          תודה, אחזור אליך בקרוב
        </h1>

        <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-10">
          קיבלתי את הפרטים שלך.
          בשיחה קצרה נבדוק איך אפשר לבנות לעסק שלך מנוע תוכן וסרטונים בעזרת AI,
          בלי לפתוח מצלמה ובלי להסתבך עם עריכה.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-white text-black px-8 py-4 text-base font-semibold hover:bg-white/90 transition"
        >
          חזרה לעמוד הראשי
        </Link>
      </section>
    </main>
  );
}
