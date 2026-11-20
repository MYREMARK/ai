"use client";

import { useEffect } from "react";
import { CHOICE_EVENT, getCookieChoice, loadMetaPixel } from "@/lib/meta-pixel";

/** Loads Meta Pixel only for visitors who accepted it (now, or earlier on this browser). Renders nothing. */
export function MetaPixelLoader() {
  useEffect(() => {
    const sync = () => {
      if (getCookieChoice() === "accepted") loadMetaPixel();
    };
    sync();
    window.addEventListener(CHOICE_EVENT, sync);
    return () => window.removeEventListener(CHOICE_EVENT, sync);
  }, []);
  return null;
}
