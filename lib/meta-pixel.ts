// Meta Pixel is loaded ONLY after the visitor accepted it in the cookie banner. Nothing is loaded or sent to
// Meta before that, and a visitor who declines gets no pixel at all (the site works the same).
// The pixel is initialised without any user data (no advanced matching) and with automatic configuration
// switched off, so it does not read form fields or buttons on its own.
export const PIXEL_ID = "2008582006089366";
export const CHOICE_KEY = "cookie-consent-v2"; // "accepted" | "declined" (the old key "cookie-banner-accepted" was only an acknowledgement and is ignored)
export const CHOICE_EVENT = "cookie-choice-changed";
export const OPEN_SETTINGS_EVENT = "cookie-settings-open";

export type CookieChoice = "accepted" | "declined" | null;

export function getCookieChoice(): CookieChoice {
  try {
    const v = window.localStorage.getItem(CHOICE_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

export function setCookieChoice(choice: "accepted" | "declined") {
  try {
    window.localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    /* storage blocked: the choice only applies to this page view */
  }
  window.dispatchEvent(new Event(CHOICE_EVENT));
}

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: unknown;
  loaded: boolean;
  version: string;
};
type PixelWindow = Window & { fbq?: FbqFn; _fbq?: FbqFn; __metaPixelLoaded?: boolean };

/** Loads the pixel once per page view. Call it only when the visitor has accepted. */
export function loadMetaPixel() {
  if (typeof window === "undefined") return;
  const w = window as PixelWindow;
  if (w.__metaPixelLoaded || w.fbq) return;
  w.__metaPixelLoaded = true;

  const n = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  } as FbqFn;
  w.fbq = n;
  if (!w._fbq) w._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];

  const t = document.createElement("script");
  t.async = true;
  t.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  if (first?.parentNode) first.parentNode.insertBefore(t, first);
  else document.head.appendChild(t);

  n("set", "autoConfig", false, PIXEL_ID); // no automatic button/form detection
  n("init", PIXEL_ID); // no user data passed: no advanced matching from the code
  n("track", "PageView");
}

/** Sends a standard event, only if the visitor accepted. */
export function trackMeta(event: string) {
  if (typeof window === "undefined" || getCookieChoice() !== "accepted") return;
  loadMetaPixel();
  (window as PixelWindow).fbq?.("track", event);
}
