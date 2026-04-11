"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  image: string;
};

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 3000);

    return () => window.clearInterval(id);
  }, [items.length]);

  useEffect(() => {
    const current = itemRefs.current[active];
    if (current) {
      setHeight(current.offsetHeight);
    }
  }, [active, items]);

  useEffect(() => {
    const onResize = () => {
      const current = itemRefs.current[active];
      if (current) {
        setHeight(current.offsetHeight);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  const goPrev = () => setActive((prev) => (prev - 1 + items.length) % items.length);
  const goNext = () => setActive((prev) => (prev + 1) % items.length);

  return (
    <div className="glass-card relative overflow-hidden p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_26%)]" />

      <div
        className="relative transition-[height] duration-500"
        style={{
          height: height ? `${height + 24}px` : "auto",
          minHeight: "520px"
        }}
      >
        {items.map((item, index) => (
          <div
            key={item.name}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`absolute inset-0 transition-all duration-700 ${
              index === active
                ? "translate-x-0 opacity-100"
                : "translate-x-3 opacity-0 pointer-events-none"
            }`}
          >
            <div className="flex flex-col gap-6 md:flex-row-reverse md:items-start">
              <div className="shrink-0">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/10 md:h-28 md:w-28">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="flex-1">
                <p className="text-base leading-8 text-slate-100 md:text-xl md:leading-9">
                  “{item.quote}”
                </p>

                <div className="mt-8 border-t border-white/10 pt-5">
                  <p className="text-xl font-semibold text-white">{item.name}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300 md:text-base">
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goPrev}
          aria-label="המלצה קודמת"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xl text-white transition hover:bg-white/10"
        >
          →
        </button>

        <div className="flex gap-2">
          {items.map((_, index) => (
            <span
              key={index}
              className={`h-2.5 w-2.5 rounded-full transition ${
                index === active ? "bg-cyan-300" : "bg-white/20"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="המלצה הבאה"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xl text-white transition hover:bg-white/10"
        >
          ←
        </button>
      </div>
    </div>
  );
}