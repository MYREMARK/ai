"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollVideoRevealSection } from "@/components/scroll-video-reveal-section";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { FaqAccordion } from "@/components/faq-accordion";
import { CookieBanner } from "@/components/cookie-banner";
import { Reveal } from "@/components/reveal";
import { InteractiveGlow } from "@/components/interactive-glow";
import MobileTouchGlow from "@/components/mobile-touch-glow";

const painPoints = [
  "נמאס לי להיות המנהל, המזכירה ואיש השיווק של עצמי",
  "ניסיתי ChatGPT, אבל התוצאות יצאו כלליות ולא באמת דיברו בשפה של העסק שלי",
  "אני יודע שאני צריך לפרסם יותר, אבל אין לי זמן לחשוב על רעיונות, פוסטים וסרטונים",
  "כל דף נחיתה, סרטון או קריאייטיב קטן הופך לתלות באנשים אחרים ולבזבוז זמן",
];

const solutionPoints = [
  "איפה AI יכול לחסוך לך זמן כבר השבוע",
  "איזה סוגי תוכן נכון לעסק שלך לייצר",
  "איך לעבוד עם ChatGPT וכלי AI בצורה שמייצרת תוצאה שימושית ולא טקסט גנרי",
  "איך לייצר פוסטים, תמונות, סרטונים ודפי נחיתה בלי להתחיל מאפס בכל פעם",
  "מה נכון ללמוד בהדרכת 1:1 כדי שתוכל ליישם לבד בעסק שלך",
];

const trustLine = [
  { icon: "💸", value: "$46B", label: "שוק AI עולמי 2032" },
  {
    icon: "⏱️",
    value: "63%",
    label: "חיסכון בזמן עבודה",
    note: "* משרד הכלכלה והתעשייה 2025",
  },
  { icon: "💼", value: "20+", label: "שנות ניסיון בתעשייה" },
];

const learningTracks = [
  {
    title: "מנוע תוכן לעסק של אדם אחד",
    text:
      "נבנה יחד שיטת עבודה ליצירת רעיונות, פוסטים, כותרות, תסריטים וניסוחים בקול של העסק שלך. המטרה היא שתדע לייצר תוכן שיווקי לבד, בלי להיתקע מול מסך ריק ובלי להרגיש שהתוכן נשמע כמו כולם.",
  },
  {
    title: "יצירת תמונות וקריאייטיב ריאליסטים",
    text:
      "נלמד לייצר תמונות, מודעות, ויזואלים ותמונות תדמית שמתאימים לעסק עצמאי, בלי ימי צילום, בלי הפקות כבדות ובלי תלות בכל משימה קטנה במעצב או צלם חיצוני.",
  },
  {
    title: "יצירת ועריכת וידאו",
    text:
      "נראה איך להפוך רעיון לסרטון קצר שמוכן לפרסום ברשתות, גם אם אין לך זמן להפקות וגם אם לא תמיד בא לך להצטלם. נעבוד עם כלים כמו Captions, Kling ו Flow בצורה פרקטית, כולל Lip sync כשזה מתאים למטרה.",
  },
  {
    title: "דפי נחיתה ואתרים ממירים",
    text:
      "נלמד איך לתכנן ולבנות דפי נחיתה ואתרים פשוטים שנראים טוב ומשרתים הצעה עסקית ברורה, בעזרת כלים כמו Lovable ו VSCode, בלי לחכות שבועות ובלי לשלם אלפים על כל עמוד חדש.",
  },
];

const testimonials = [
  {
    quote:
      "הייתה לי הזכות לעבוד עם מארק הן כמרצה והן כמדריך פרטי. הוא משלב מומחיות מקצועית עמוקה עם סגנון הוראה ברור ופרקטי שמאפשר לסטודנטים להתקדם במהירות ובביטחון. מארק קשוב, תומך ומחויב באמת להתפתחות של כל תלמיד ותלמידה. הידע שלו מהתעשייה וההכוונה שהוא מעניק מובילים בעקביות לשיפור ממשי במיומנויות ובחשיבה היצירתית.",
    name: "דקל מועלם",
    role: "מנהל תחום ידע והדרכה אקדמית נטקראפט קבוצת פילת",
    image: "/deckel.webp",
  },
  {
    quote:
      "עבדתי עם מארק גם כמנהלת שלו וגם כתלמידה בשיעורים פרטיים לבינה מלאכותית. הוא בולט ברוגע, סבלנות וחשיבה יצירתית, ותמיד מביא סדר ובהירות לכל פרויקט. כמורה הוא מצטיין ביכולת לפשט נושאים מורכבים ולהפוך את הלמידה לברורה, מסודרת ומעוררת השראה. כל שיעור היה ממוקד ויעיל, עם סיכום מסודר שאפשר להמשיך ללמוד ולהעמיק לבד. ממליצה עליו בחום לכל מי שרוצה ללמוד בינה מלאכותית בצורה הדרגתית, מקצועית ומעוררת מוטיבציה.",
    name: "אליס גולמן",
    role: "מנהלת צוות קריאטיב לשעבר, מעצבת עצמאית",
    image: "/alice.webp",
  },
  {
    quote:
      "ללמוד ממארק כמורה פרטי לבינה מלאכותית הייתה חוויה משמעותית ומדויקת. הוא שולט לעומק בכלי AI מתקדמים ויודע להסביר ולהכווין אותם לעבודה פרקטית ויומיומית בצורה ברורה ונגישה. בכל מפגש מארק ידע לאבחן בדיוק מה נכון לי ללמוד ואיך לשלב בינה מלאכותית בצורה חכמה שמשרתת את היצירה ולא מחליפה אותה. ההכוונה שלו ממוקדת, אסטרטגית ומביטה קדימה על ההתפתחות המקצועית.",
    name: "יעל נאמן",
    role: "קונספט ארטיסט, מאיירת ומעצבת",
    image: "/yael.webp",
  },
  {
    quote:
      "מארק תודה רבה מאז הדגשים שנתת לי בפגישה המודעות עושות הרבה יותר תנועה והמרות. פתחת לי את הראש לכיוונים חדשים, אין עליך. עזרת לי מאד! זהו רק רציתי לומר תודה עליך.",
    name: "עוז יהודה",
    role: "בעל עסק לשיווק דיגיטל ואוטומציות",
    image: "/oz.webp",
  },
];

const fits = [
  "עצמאים, פרילנסרים וסולופרנרים שרוצים לייצר יותר תוכן בפחות זמן",
  "בעלי עסקים שרוצים ללמוד לעבוד עם AI בצורה פרקטית ולא תאורטית",
  "מי שרוצה ליצור פוסטים, תמונות, סרטונים ודפי נחיתה בלי להיות תלוי בכל פעם באחרים",
  "מי שמוכן להשקיע בהדרכת 1:1 כדי לבנות שיטת עבודה שמתאימה לעסק שלו",
];

const notFits = [
  "מי שמחפש קסם בלי ללמוד את דרך העבודה",
  "מי שרוצה שמישהו אחר יעשה הכול במקומו",
  "מי שלא מוכן לתרגל ולהטמיע את הכלים בעסק",
  "מי שמחפש קורס מוקלט במקום הדרכה מעשית",
];

const faqItems = [
  {
    question: "האם אני צריך ידע מוקדם בבינה מלאכותית?",
    answer:
      "לא. ההדרכה בנויה גם למי שניסה קצת את ChatGPT וגם למי שמתחיל כמעט מאפס. המטרה היא לבנות דרך עבודה פשוטה וברורה שמתאימה לעסק שלך.",
  },
  {
    question: "מה קורה בשיחת האבחון?",
    answer:
      "בשיחת האבחון נבין מה העסק שלך עושה, איזה תכנים אתה רוצה לייצר, איפה אתה מבזבז זמן היום, ואיך הדרכת AI אישית 1:1 יכולה לעזור לך לייצר פוסטים, סרטונים ודפי נחיתה בצורה עצמאית יותר.",
  },
  {
    question: "האם זו הדרכה אישית או קורס מוקלט?",
    answer:
      "זו הדרכה אישית 1:1 בזום או פרונטלית, לפי מה שמתאים. אנחנו עובדים על העסק שלך, על התכנים שלך, על ההצעה שלך ועל הכלים שבאמת ישרתו אותך.",
  },
  {
    question: "מה אפשר ללמוד בהדרכה?",
    answer:
      "אפשר ללמוד לעבוד נכון עם ChatGPT, ליצור רעיונות ופוסטים, לבנות פרומפטים טובים יותר, ליצור תמונות, סרטונים קצרים, סנכרון שפתיים, דפי נחיתה ואתרים פשוטים בעזרת כלי AI.",
  },
];

const floatingNodes = [
  {
    size: "h-32 w-32 md:h-56 md:w-56",
    top: "top-[8%]",
    side: "right-[2%]",
    delay: "[animation-delay:-2s]",
    duration: "[animation-duration:13s]",
    speed: 0.13,
  },
  {
    size: "h-24 w-24 md:h-32 md:w-32",
    top: "top-[18%]",
    side: "left-[3%]",
    delay: "[animation-delay:-6s]",
    duration: "[animation-duration:10s]",
    speed: 0.2,
  },
  {
    size: "h-28 w-28 md:h-40 md:w-40",
    top: "top-[40%]",
    side: "right-[6%]",
    delay: "[animation-delay:-4s]",
    duration: "[animation-duration:12s]",
    speed: 0.16,
  },
  {
    size: "h-20 w-20 md:h-28 md:w-28",
    top: "top-[58%]",
    side: "left-[6%]",
    delay: "[animation-delay:-8s]",
    duration: "[animation-duration:9s]",
    speed: 0.24,
  },
  {
    size: "h-28 w-28 md:h-48 md:w-48",
    top: "top-[72%]",
    side: "right-[4%]",
    delay: "[animation-delay:-10s]",
    duration: "[animation-duration:15s]",
    speed: 0.11,
  },
  {
    size: "h-20 w-20 md:h-24 md:w-24",
    top: "top-[84%]",
    side: "left-[10%]",
    delay: "[animation-delay:-5s]",
    duration: "[animation-duration:11s]",
    speed: 0.27,
  },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
      {children}
    </div>
  );
}

function BigHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-4 text-[3rem] font-semibold leading-[1.06] text-white lg:text-[3.2rem]">
      {children}
    </h2>
  );
}

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);

  const [formErrors, setFormErrors] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    business: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [hideFloatingCta, setHideFloatingCta] = useState(false);
  const [cookieBannerVisible, setCookieBannerVisible] = useState(false);
  const leadFormRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const target = leadFormRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHideFloatingCta(entry.isIntersecting);
      },
      {
        threshold: 0.4,
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "fullName" || name === "phone" || name === "email") {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {
      fullName: "",
      phone: "",
      email: "",
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^0\d{8,9}$/;

    if (!formData.fullName.trim()) {
      errors.fullName = "נא למלא שם מלא";
    }

    if (!formData.phone.trim()) {
      errors.phone = "נא למלא מספר טלפון";
    } else if (!phoneRegex.test(formData.phone.replace(/[-\s]/g, ""))) {
      errors.phone = "נא לבדוק שוב את מספר הטלפון";
    }

    if (!formData.email.trim()) {
      errors.email = "נא למלא כתובת מייל";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "נא לבדוק שוב את המייל";
    }

    setFormErrors(errors);

    return !errors.fullName && !errors.phone && !errors.email;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "שגיאה בשליחה");
      }

      setFormMessage("הפרטים נשלחו בהצלחה. אחזור אליך בהקדם.");
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        business: "",
      });
    } catch (error) {
      setFormMessage("משהו השתבש. נסה שוב בעוד רגע.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative overflow-x-hidden bg-slate-950 pb-36 md:pb-20">
      <MobileTouchGlow />
      <CookieBanner onVisibilityChange={setCookieBannerVisible} />

      <a
        href="#lead-form"
        className={`cta-shimmer fixed left-1/2 z-[99999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full px-6 py-4 text-center text-sm font-semibold text-cyan-100 backdrop-blur-xl transition-all duration-300 md:w-auto md:px-12 md:py-5 md:text-lg lg:px-14 lg:py-5 lg:text-xl relative overflow-hidden ${
          cookieBannerVisible
            ? "bottom-28 md:bottom-24"
            : "bottom-5 md:bottom-8"
        } ${
          hideFloatingCta
            ? "pointer-events-none opacity-0 translate-y-4"
            : "opacity-100"
        }`}
      >
        <span className="relative z-10">שיחת אבחון ללא עלות</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_35%,rgba(56,189,248,0.18),transparent_36%),radial-gradient(circle_at_70%_70%,rgba(167,139,250,0.12),transparent_34%)]"
        />
      </a>

      <InteractiveGlow />

      <div className="pointer-events-none absolute inset-0 -z-30 bg-hero-radial" />
      <div className="pointer-events-none absolute inset-0 -z-20 tech-noise opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[720px] grid-overlay opacity-35" />

      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        {floatingNodes.map((node, index) => (
          <div
            key={index}
            className={`absolute ${node.top} ${node.side} ${node.size}`}
            style={{
              transform: `translate3d(0, ${scrollY * node.speed}px, 0)`,
            }}
          >
            <div
              className={`h-full w-full tech-float ${node.delay} ${node.duration}`}
            >
              <div className="relative h-full w-full rounded-full opacity-70 blur-[3px] md:opacity-100 md:blur-[5px]">
                <div className="absolute inset-0 rounded-full bg-cyan-300/16 blur-[68px] md:blur-[96px]" />
                <div className="absolute inset-[6%] rounded-full bg-fuchsia-400/12 blur-[56px] md:blur-[84px]" />

                <div className="absolute inset-0 rounded-full border border-cyan-200/16 bg-white/[0.035] shadow-[0_0_100px_rgba(103,232,249,0.24)] backdrop-blur-xl md:border-cyan-200/22 md:bg-white/[0.045] md:shadow-[0_0_140px_rgba(103,232,249,0.30)]" />

                <div className="absolute inset-[10%] rounded-full border border-white/8 blur-[2px]" />
                <div className="absolute inset-[24%] rounded-full border border-cyan-200/10 blur-[2px]" />

                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.14),transparent_22%),radial-gradient(circle_at_65%_70%,rgba(103,232,249,0.14),transparent_30%),linear-gradient(135deg,rgba(103,232,249,0.14),transparent_48%,rgba(217,70,239,0.10))] blur-[4px]" />

                <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/80 shadow-[0_0_38px_rgba(103,232,249,0.95)] blur-[1px] md:h-3 md:w-3" />
                <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/16 blur-[2px]" />

                <div className="absolute left-[18%] top-[22%] h-1.5 w-1.5 rounded-full bg-white/60 shadow-[0_0_22px_rgba(255,255,255,0.7)] blur-[1px]" />
                <div className="absolute right-[20%] top-[30%] h-1 w-1 rounded-full bg-cyan-200/70 shadow-[0_0_18px_rgba(103,232,249,0.8)] blur-[1px]" />
                <div className="absolute bottom-[20%] left-[28%] h-1 w-1 rounded-full bg-fuchsia-200/60 shadow-[0_0_16px_rgba(217,70,239,0.7)] blur-[1px]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="relative isolate overflow-hidden bg-black min-h-[100svh] md:aspect-video md:min-h-0">
        <div className="absolute inset-0 -z-40 bg-[url('/hero-office.png')] bg-cover bg-center" />

        <div className="absolute inset-0 -z-30 hidden overflow-hidden bg-black md:block">
          <div className="hero-video-bg">
            <iframe
              className="hero-video-cover"
              src="https://player.vimeo.com/video/1163050014?autoplay=1&muted=1&controls=1&loop=1&autopause=0&title=0&byline=0&portrait=0&cc=1&dnt=1"
              title="וידאו הסבר"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[38%] bg-gradient-to-l from-slate-950/18 via-slate-950/8 to-transparent md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-[22%] -z-10 hidden w-56 bg-gradient-to-l from-cyan-200/16 via-white/4 to-transparent blur-3xl md:block" />
        <div className="pointer-events-none absolute right-[4%] top-[12%] -z-10 hidden h-52 w-52 rounded-full bg-cyan-200/14 blur-3xl md:block" />
        <div className="pointer-events-none absolute bottom-[10%] right-[10%] -z-10 hidden h-44 w-44 rounded-full bg-amber-200/10 blur-3xl md:block" />

        <div className="pointer-events-none absolute inset-0 z-20 hidden md:block">
          <div className="absolute right-[max(1.5rem,4vw)] top-1/2 w-[min(31rem,calc(100vw-3rem))] -translate-y-1/2">
            <div className="pointer-events-auto rounded-[34px] border border-white/15 bg-slate-950/78 p-7 text-right shadow-[0_24px_90px_rgba(2,6,23,0.62)] backdrop-blur-2xl lg:p-8">
              <SectionLabel>לעצמאים ופרילנסרים שרוצים לעבוד חכם יותר</SectionLabel>

              <h1 className="text-[3rem] font-semibold leading-[1.06] text-white lg:text-[3.2rem]">
                לגרום לבינה
                <br />
                <span className="text-cyan-300">לעבוד עבורך</span>
              </h1>

              <p className="mt-6 text-xl leading-8 text-slate-50">
                בשיחת אבחון קצרה נבין איך הדרכת AI אישית 1:1 יכולה לעזור לך לייצר תוכן ודפי נחיתה בעצמך, לחסוך זמן ולא להיות תלוי באנשים אחרים
              </p>

              <div className="mt-8 rounded-[28px] border border-white/14 bg-black/50 p-5 backdrop-blur-xl text-right">
                <p className="text-sm leading-7 text-slate-50">
                  ״במקום להוציא אלפי שקלים, על ימי צילום, צוותים והפקות, אפשר
                  לייצר היום תכנים איכותיים תוך דקות... המטרה היא מחשבה ארוכת
                  טווח על הגדלת ההכנסות של העסק.״
                </p>

                <div className="mt-3 flex items-center justify-between gap-3" dir="rtl">
                  <span className="text-sm text-slate-200">
                    מתוך הראיון עם מארק זוסמנוביץ׳
                  </span>

                  <Image
                    src="/the-marker.webp"
                    alt="TheMarker"
                    width={120}
                    height={34}
                    className="h-auto w-[100px] shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section-shell relative z-20 flex h-full items-start pt-4 pb-8 md:hidden">
          <div className="w-full">
            <div className="rounded-[34px] border border-white/15 bg-slate-950/70 p-6 text-center shadow-[0_24px_90px_rgba(2,6,23,0.56)] backdrop-blur-xl">
              <SectionLabel>לעצמאים ופרילנסרים שרוצים לעבוד חכם יותר</SectionLabel>

              <h1 className="mt-4 text-[3rem] font-semibold leading-[1.06] text-white">
                לגרום לבינה
                <br />
                <span className="text-cyan-300">לעבוד עבורך</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-50">
                בשיחת אבחון קצרה נבין איך הדרכת AI אישית 1:1 יכולה לעזור לך לייצר תוכן ודפי נחיתה בעצמך, לחסוך זמן ולא להיות תלוי באנשים אחרים
              </p>

              <div className="mt-8 overflow-hidden rounded-[28px] border border-white/12 bg-black/20 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
                <div className="relative aspect-video">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src="https://player.vimeo.com/video/1163050014?autoplay=1&muted=1&controls=1&loop=1&autopause=0&title=0&byline=0&portrait=0&cc=1&dnt=1"
                    title="וידאו הסבר למובייל"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                    allowFullScreen
                  />
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/14 bg-black/50 p-5 backdrop-blur-xl text-right">
                <p className="text-sm leading-7 text-slate-50">
                  ״במקום להוציא אלפי שקלים, על ימי צילום, צוותים והפקות, אפשר
                  לייצר היום תכנים איכותיים תוך דקות... המטרה היא מחשבה ארוכת
                  טווח על הגדלת ההכנסות של העסק.״
                </p>

                <div className="mt-3 flex items-center justify-between gap-3" dir="rtl">
                  <span className="text-sm text-slate-200">
                    מתוך הראיון עם מארק זוסמנוביץ׳
                  </span>

                  <Image
                    src="/the-marker.webp"
                    alt="TheMarker"
                    width={120}
                    height={34}
                    className="h-auto w-[100px] shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-8 md:py-10">
        <div className="grid gap-3 md:grid-cols-3">
          {trustLine.map((item) => (
            <div
              key={item.label}
              className="rounded-[26px] border border-white/10 bg-slate-950/55 px-5 py-6 text-center backdrop-blur-lg shadow-[0_16px_50px_rgba(2,6,23,0.32)] md:px-7 md:py-8"
            >
              <div className="text-5xl md:text-6xl">{item.icon}</div>
              <div className="mt-4 text-5xl font-semibold leading-none text-white md:text-6xl">
                {item.value}
              </div>
              <div className="mt-4 text-lg font-medium tracking-[0.08em] text-slate-200 md:text-xl">
                {item.label}
              </div>
              {"note" in item && item.note ? (
                <p className="mt-1 text-sm leading-snug text-slate-400/75">
                  {item.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <Reveal direction="right" delay={200}>
        <section className="section-shell py-10 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-red-400 md:text-sm">
              ⚠ SYSTEM ALERT
            </p>
            <BigHeading>כנראה שזה כבר נוגע בך</BigHeading>
          </div>
        </section>

        <section className="section-shell py-10 md:py-16">
          <div className="mx-auto max-w-5xl">
            <SectionLabel>הבעיה</SectionLabel>

            <div className="grid gap-4 md:grid-cols-2">
              {painPoints.map((pain) => (
                <div key={pain} className="glass-card p-6">
                  <p className="text-lg leading-8 text-slate-200">❌ {pain}</p>
                </div>
              ))}
            </div>

            <div className="mt-20 rounded-3xl border border-cyan-400/15 bg-cyan-400/10 p-8 text-center">
              <p className="text-xl font-semibold text-white md:text-2xl">
                זה לא כי משהו בך לא בסדר
              </p>
              <p className="mt-3 text-lg text-slate-300">
                זה כי אין לך עדיין שיטה שעובדת לך
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal direction="right" delay={200}>
        <section className="section-shell py-10 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300 drop-shadow-[0_0_18px_rgba(52,211,153,0.45)] md:text-sm">
              ✓ SOLUTION ARCHITECTURE
            </p>
            <BigHeading>וזה בדיוק מה שאנחנו נפתור</BigHeading>
          </div>
        </section>
      </Reveal>

      <Reveal direction="left" delay={400}>
        <section className="section-shell py-10 md:py-16">
          <div className="mx-auto max-w-5xl">
            <SectionLabel>הפתרון</SectionLabel>

            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="glass-card p-7 md:p-8">
                <h2 className="text-3xl font-semibold text-white">
                  זו לא עוד הדרכה על כלים
                </h2>
                <p className="mt-3 text-xl text-cyan-200">
                  זו הדרכת 1:1 שבונה לך שיטת עבודה
                </p>
                <p className="mt-6 text-lg leading-8 text-slate-300 md:text-xl">
                  בשיחת האבחון נבין מה העסק שלך באמת צריך, איזה תכנים כדאי לך לייצר, ואיך הדרכת AI אישית יכולה לעזור לך לעבוד מהר יותר, מדויק יותר ועצמאי יותר.
                </p>

                <div className="mt-8 rounded-3xl border border-cyan-400/15 bg-cyan-400/10 p-5">
                  <p className="text-lg font-medium text-white md:text-xl">
                    המטרה פשוטה
                  </p>
                  <p className="mt-2 text-lg leading-7 text-slate-200 md:text-xl">
                    לצאת מהשיחה עם כיוון ברור להדרכת 1:1 שמותאמת לעסק שלך.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {solutionPoints.map((item, index) => (
                  <div key={item} className="glass-card flex items-start gap-4 p-5">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                      0{index + 1}
                    </div>
                    <p className="text-lg leading-8 text-slate-200 md:text-xl">
                      ✔ {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <ScrollVideoRevealSection tracks={learningTracks} />

      <section className="section-shell py-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Testimonials</SectionLabel>
          <BigHeading>מה אומרים תלמידים ובעלי עסקים</BigHeading>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <TestimonialCarousel items={testimonials} />
        </div>
      </section>

      <section className="section-shell py-10 md:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6 md:p-8">
            <SectionLabel>מתאים לכל מי ש:</SectionLabel>
            <div className="space-y-4">
              {fits.map((item) => (
                <p key={item} className="text-lg leading-8 text-slate-200">
                  ✔ {item}
                </p>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 md:p-8">
            <SectionLabel>לא מתאים לכל מי ש:</SectionLabel>
            <div className="space-y-4">
              {notFits.map((item) => (
                <p key={item} className="text-lg leading-8 text-slate-200">
                  ✖ {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Reveal direction="up" delay={300}>
        <section className="section-shell py-10 md:py-16">
          <div className="mx-auto max-w-5xl">
            <SectionLabel>למה ללמוד דווקא איתי?</SectionLabel>

            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="glass-card p-7 md:p-8">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/90">
                  נעים מאוד
                </p>

                <h2 className="mt-3 text-3xl font-semibold text-white">
                  אני מארק זוסמנוביץ׳
                </h2>

                <p className="mt-4 text-lg leading-8 text-slate-300 md:text-xl">
                  מרצה ומעצב שיווק ומוניטיזציה עם למעלה מ 20 שנות ניסיון.
                  המטרה שלי היא לסנן עבורך את הרעש ולהטמיע בדיוק את מה שיביא לעסק שלך את התוצאה המהירה והרווחית ביותר.
                </p>

                <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
                  <Image
                    src="/mark-profile.webp"
                    alt="מארק זוסמנוביץ׳"
                    width={480}
                    height={480}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="glass-card p-5">
                  <p className="text-lg leading-8 text-slate-200 md:text-xl">
                    עבדתי והובלתי תהליכים במשרדי הפרסום הגדולים בישראל, בסטארטאפים ובחברות גיימינג בינלאומיות
                  </p>
                </div>

                <div className="glass-card p-5">
                  <p className="text-lg leading-8 text-slate-200 md:text-xl">
                    מרצה לבינה מלאכותית, מיתוג וחשיבה יצירתית באקדמיית נטקראפט
                  </p>
                </div>

                <div className="glass-card p-5">
                  <p className="text-lg leading-8 text-slate-200 md:text-xl">
                    מחבר הספר Marketing Creative Hacks שנמכר באמזון עם ביקורות מצוינות ⭐⭐⭐⭐⭐
                  </p>
                </div>

                <div className="glass-card p-6">
                  <p className="text-base leading-8 text-white">
                    עוזר לעצמאים, סולופרנרים ועסקים קטנים לייצר תוכן, וידאו ודפי נחיתה בעצמם בעזרת בינה מלאכותית
                  </p>
                </div>

                <div className="mt-4 flex justify-center md:justify-end">
                  <Image
                    src="/signate.webp"
                    alt="חתימה"
                    width={120}
                    height={120}
                    className="h-auto w-[90px] opacity-90"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="section-shell py-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>F.A.Q</SectionLabel>
          <BigHeading>שאלות נפוצות</BigHeading>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      <section className="section-shell py-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300 drop-shadow-[0_0_18px_rgba(52,211,153,0.45)] md:text-sm">
            ✓ SOLUTION ARCHITECTURE
          </p>
          <BigHeading>אני רוצה להתקדם לעתיד</BigHeading>
          <p className="mt-4 text-base leading-8 text-white">
            אם הגעת עד כאן, כנראה שגם לך ברור שהעסק שלך צריך להתחיל לעבוד חכם יותר.
            בשיחת אבחון קצרה נבין איפה העסק נמצא היום, איזה תכנים הוא צריך לייצר, ואיך הדרכת AI 1:1 יכולה לעזור לך ליצור תכנים ודפי נחיתה בעצמך.
          </p>
        </div>
      </section>

      <section
        id="lead-form"
        ref={leadFormRef}
        className="section-shell scroll-mt-28 pb-6 pt-4 md:pb-10"
      >
        <div className="mx-auto max-w-3xl glass-card p-6 md:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm text-slate-300">
                שם מלא <span className="text-red-400">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="השם שלך"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 ${
                  formErrors.fullName
                    ? "border-red-400 focus:border-red-400"
                    : "border-white/10 focus:border-cyan-400/40"
                }`}
              />
              {formErrors.fullName && (
                <p className="mt-2 text-sm text-red-400">{formErrors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm text-slate-300">
                טלפון <span className="text-red-400">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="0500000000"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 ${
                  formErrors.phone
                    ? "border-red-400 focus:border-red-400"
                    : "border-white/10 focus:border-cyan-400/40"
                }`}
              />
              {formErrors.phone && (
                <p className="mt-2 text-sm text-red-400">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
                אימייל <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 ${
                  formErrors.email
                    ? "border-red-400 focus:border-red-400"
                    : "border-white/10 focus:border-cyan-400/40"
                }`}
              />
              {formErrors.email && (
                <p className="mt-2 text-sm text-red-400">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="business" className="mb-2 block text-sm text-slate-300">
                תחום העסק שלך
              </label>
              <input
                id="business"
                name="business"
                type="text"
                placeholder="יועץ / מטפל / מעצב / בעל סטודיו..."
                value={formData.business}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-white px-6 py-4 text-center text-base font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "שולח..." : "שיחת אבחון ללא עלות"}
            </button>

            {formMessage && (
              <p className="text-center text-sm text-cyan-300">{formMessage}</p>
            )}

            <p className="text-center text-xs leading-6 text-slate-500">
              <span className="text-red-400">*</span> שדה חובה
            </p>

            <p className="text-center text-sm leading-7 text-slate-400">
              שליחת הפרטים מהווה אישור ל
              <a
                href="/privacy-policy"
                className="mx-1 text-cyan-300 underline underline-offset-4"
              >
                מדיניות הפרטיות
              </a>
              ולשימוש בפרטים לצורך יצירת קשר, תיאום שיחה, מדידה ופרסום מותאם.
            </p>
          </form>
        </div>
      </section>

      <footer className="section-shell border-t border-white/10 pb-24 pt-1 text-center text-sm text-slate-500 md:pb-10">
        כל הזכויות שמורות למארק זוסמנוביץ׳ ReMark 2026 ©
      </footer>
    </main>
  );
}