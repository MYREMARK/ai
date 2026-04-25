"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={item.question} className="glass-card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-right md:px-6"
            >
              <span className="text-lg font-medium text-white md:text-xl">
                {item.question}
              </span>
              <span
                className={`text-2xl text-cyan-300 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                ⌄
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-white/10 px-5 py-5 text-lg md:text-xl leading-8 text-slate-300 md:px-6">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}