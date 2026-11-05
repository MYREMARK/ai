"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { FaqAccordion } from "@/components/faq-accordion";
import { CookieBanner } from "@/components/cookie-banner";
import { Reveal } from "@/components/reveal";
import { InteractiveGlow } from "@/components/interactive-glow";
import MobileTouchGlow from "@/components/mobile-touch-glow";

const CTA_LABEL = "שיחת ייעוץ והמלצה על מסלול הדרכה";

const trustLine = [
  { icon: "💼", value: "20+", label: "שנות ניסיון בתעשייה" },
  {
    icon: "⏱️",
    value: "63%",
    label: "חיסכון בזמן עבודה",
    note: "* משרד הכלכלה והתעשייה 2025",
  },
  { icon: "💸", value: "$46B", label: "שוק AI עולמי 2032" },
];

const approachPoints = [
  {
    title: "מתחילים מהעסק שלך",
    text: "לא מלמדים כלים בחלל ריק. בוחרים צורך אמיתי בעסק ועובדים עליו.",
  },
  {
    title: "עבודה מעשית, צעד אחרי צעד",
    text: "בונים יחד, על המסך שלך, ויוצאים עם דברים שאפשר להשתמש בהם.",
  },
  {
    title: "מותאם לרמה ולקצב שלך",
    text: "גם אם ניסית רק קצת ChatGPT וגם אם כבר התקדמת. אין תוכנית אחת לכולם.",
  },
];

const areas = [
  {
    id: "marketing",
    number: "01",
    icon: "🎬",
    title: "שיווק ויצירת תוכן עם AI",
    audience:
      "לבעלי עסקים שרוצים ליצור תוכן שיווקי מקצועי בעצמם.",
    topics: [
      "פוסטים ותוכן לרשתות החברתיות",
      "תמונות ונכסים קריאייטיביים לשיווק",
      "הפקת סרטונים בעזרת AI",
      "סרטונים בלי להצטלם בעצמך",
      "קופירייטינג ותוכן שיווקי",
      "דפי נחיתה וחומרי שיווק",
    ],
    card: "border-cyan-400/25 bg-gradient-to-b from-cyan-400/[0.10] to-slate-950/60 hover:border-cyan-300/50",
    glow: "bg-cyan-400/20",
    badge: "bg-cyan-400/15 text-cyan-200 border-cyan-300/25",
    dot: "bg-cyan-300",
    button:
      "border-cyan-300/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20",
  },
  {
    id: "automation",
    number: "02",
    icon: "⚙️",
    title: "AI ואוטומציה לעסק",
    audience:
      "לבעלי עסקים שרוצים לחסוך זמן ולשפר תהליכים שחוזרים על עצמם.",
    topics: [
      "בניית עוזרי AI מותאמים לעסק",
      "יצירת סוכני AI למשימות ספציפיות",
      "אוטומציה של תהליכי עבודה",
      "חיבור בין כלים ופלטפורמות",
      "שיפור משימות אדמיניסטרטיביות ושירות לקוחות",
    ],
    card: "border-emerald-400/25 bg-gradient-to-b from-emerald-400/[0.10] to-slate-950/60 hover:border-emerald-300/50",
    glow: "bg-emerald-400/20",
    badge: "bg-emerald-400/15 text-emerald-200 border-emerald-300/25",
    dot: "bg-emerald-300",
    button:
      "border-emerald-300/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20",
  },
  {
    id: "tools",
    number: "03",
    icon: "🧩",
    title: "בניית כלים דיגיטליים עם AI",
    audience:
      "לבעלי עסקים, יזמים ויוצרים שרוצים להפוך רעיון למוצר דיגיטלי שעובד.",
    topics: [
      "היכרות עם Claude Code",
      "בניית אתרים ודפי נחיתה",
      "מחשבונים וכלים אינטראקטיביים",
      "אפליקציות קטנות לעסק",
      "מערכות וכלים דיגיטליים מותאמים אישית",
    ],
    card: "border-violet-400/25 bg-gradient-to-b from-violet-400/[0.12] to-slate-950/60 hover:border-violet-300/50",
    glow: "bg-violet-400/20",
    badge: "bg-violet-400/15 text-violet-200 border-violet-300/25",
    dot: "bg-violet-300",
    button:
      "border-violet-300/30 bg-violet-400/10 text-violet-100 hover:bg-violet-400/20",
  },
];

const examples = [
  { icon: "📱", text: "פוסטים ותוכן לרשתות החברתיות" },
  { icon: "🖼️", text: "תמונות וקריאייטיב לשיווק" },
  { icon: "🎥", text: "סרטוני AI, גם בלי להצטלם" },
  { icon: "🤖", text: "עוזר AI שמכיר את העסק שלך" },
  { icon: "🔗", text: "תהליך עבודה אוטומטי בין כלים" },
  { icon: "🌐", text: "אתר או דף נחיתה" },
  { icon: "🧮", text: "מחשבון או כלי אינטראקטיבי ללקוחות" },
  { icon: "🛠️", text: "אפליקציה קטנה לצורך בעסק" },
];

const processSteps = [
  {
    title: "שיחת ייעוץ",
    text: "מבינים מה העסק עושה, מה לוקח לך זמן ומה היית רוצה ליצור.",
  },
  {
    title: "המלצה על מסלול",
    text: "בוחרים יחד מאיזה תחום להתחיל, ואם מתאים שיעור אחד או כמה מפגשי 1:1.",
  },
  {
    title: "עבודה מעשית על העסק שלך",
    text: "בונים יחד דברים אמיתיים לעסק, לא דוגמאות כלליות.",
  },
  {
    title: "ממשיכים בעצמך",
    text: "יוצאים עם הבנה ועם מה שנבנה, כדי להמשיך להשתמש בו לבד.",
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

const faqItems = [
  {
    question: "זה קורס AI כללי?",
    answer:
      "לא. זו הדרכה אישית ומעשית שמותאמת לעסק שלך ולצרכים שלך. המטרה היא ללמוד להשתמש ב AI כדי ליצור תוצאות אמיתיות ולפתור צרכים עסקיים בפועל.",
  },
  {
    question: "איך אני יודע איזה תחום מתאים לי?",
    answer:
      "לא צריך להחליט מראש. בשיחת הייעוץ נבין מה העסק שלך צריך ונמליץ על נקודת התחלה: שיווק ותוכן, אוטומציה, או בניית כלים דיגיטליים.",
  },
  {
    question: "האם צריך ידע מוקדם בבינה מלאכותית או בטכנולוגיה?",
    answer:
      "לא. ההדרכה מתאימה גם למי שניסה קצת ChatGPT וגם למי שמתחיל כמעט מאפס. עובדים לפי הרמה שלך ומתחילים מצורך אמיתי בעסק.",
  },
  {
    question: "האם אני חייב להצטלם כדי ליצור סרטונים?",
    answer:
      "לא. אחד הנושאים בתחום השיווק והתוכן הוא יצירת סרטונים בעזרת AI גם בלי להצטלם בעצמך.",
  },
  {
    question: "מה קורה בשיחת הייעוץ?",
    answer:
      "נבין מה העסק שלך עושה, מה היית רוצה ליצור או לשפר, ומה עוצר אותך היום. בסוף השיחה תקבל המלצה על מסלול הדרכה מתאים, ואם זה נכון, שיעור אישי אחד או כמה מפגשי 1:1.",
  },
  {
    question: "האם התוכן של ההדרכה קבוע?",
    answer:
      "לא. שלושת התחומים הם קטגוריות כלליות, והתוכן המפורט נקבע יחד איתך לפי העסק והצרכים שלך.",
  },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
      {children}
    </div>
  );
}

function SectionHeading({
  label,
  children,
  sub,
}: {
  label?: string;
  children: ReactNode;
  sub?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <h2 className="text-[2.1rem] font-semibold leading-[1.12] text-white md:text-5xl">
        {children}
      </h2>
      {sub ? (
        <p className="mt-4 text-lg leading-8 text-slate-300 md:text-xl">{sub}</p>
      ) : null}
    </div>
  );
}

function CtaLink({
  children = CTA_LABEL,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <a
      href="#lead-form"
      className={`inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-center text-base font-semibold text-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.25)] transition hover:opacity-90 md:text-lg ${className}`}
    >
      {children}
    </a>
  );
}

export default function HomePage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      }, 100);
    }
  }, []);

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

      setFormData({
        fullName: "",
        phone: "",
        email: "",
        business: "",
      });

      window.location.href = "/thank-you";
    } catch (error) {
      setFormMessage("משהו השתבש. נסה שוב בעוד רגע.");
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
        <span className="relative z-10">שיחת ייעוץ ללא עלות</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_35%,rgba(56,189,248,0.18),transparent_36%),radial-gradient(circle_at_70%_70%,rgba(167,139,250,0.12),transparent_34%)]"
        />
      </a>

      <InteractiveGlow />

      <div className="pointer-events-none absolute inset-0 -z-30 bg-hero-radial" />
      <div className="pointer-events-none absolute inset-0 -z-20 tech-noise opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[720px] grid-overlay opacity-35" />

      {/* Header */}
      <header className="section-shell relative z-30 flex items-center justify-between py-4">
        <a href="#top" aria-label="ReMark">
          <Image
            src="/remarkLogo.webp"
            alt="ReMark"
            width={140}
            height={48}
            priority
            className="h-9 w-auto md:h-11"
          />
        </a>

        <nav
          aria-label="ניווט ראשי"
          className="hidden items-center gap-7 text-sm text-slate-300 md:flex"
        >
          <a href="#areas" className="transition hover:text-white">
            תחומי ההדרכה
          </a>
          <a href="#process" className="transition hover:text-white">
            איך זה עובד
          </a>
          <a href="#about" className="transition hover:text-white">
            על מארק
          </a>
          <a href="#faq" className="transition hover:text-white">
            שאלות נפוצות
          </a>
        </nav>

        <a
          href="#lead-form"
          className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
        >
          לשיחת ייעוץ
        </a>
      </header>

      {/* 1. Hero */}
      <section id="top" className="section-shell relative pb-10 pt-8 md:pb-20 md:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-white/14 bg-black/40 px-4 py-2 text-sm text-slate-50 backdrop-blur-xl">
            הדרכת AI אישית ומעשית לבעלי עסקים
          </div>

          <h1 className="text-[2.7rem] font-semibold leading-[1.05] text-white sm:text-6xl lg:text-[4.6rem]">
            הופכים AI
            <br />
            <span className="bg-gradient-to-l from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              לכלי מעשי בעסק שלך
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-2xl md:leading-9">
            הדרכה אישית ומעשית שמותאמת לעסק שלך: ליצור תוכן, לשפר שיווק, לחסוך זמן,
            לבנות אוטומציות וכלים דיגיטליים בעזרת AI.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaLink className="w-full sm:w-auto">{CTA_LABEL}</CtaLink>
            <a
              href="#areas"
              className="w-full rounded-full border border-white/20 px-7 py-4 text-center text-base font-medium text-white transition hover:bg-white/10 sm:w-auto md:text-lg"
            >
              לתחומי ההדרכה
            </a>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            שיחת הייעוץ ללא עלות, ובלי התחייבות
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-3 md:grid-cols-3">
          {trustLine.map((item) => (
            <div
              key={item.label}
              className="rounded-[26px] border border-white/10 bg-slate-950/55 px-5 py-5 text-center backdrop-blur-lg shadow-[0_16px_50px_rgba(2,6,23,0.32)] md:py-7"
            >
              <div className="text-3xl md:text-4xl">{item.icon}</div>
              <div className="mt-3 text-4xl font-semibold leading-none text-white md:text-5xl">
                {item.value}
              </div>
              <div className="mt-3 text-base font-medium text-slate-200 md:text-lg">
                {item.label}
              </div>
              {"note" in item && item.note ? (
                <p className="mt-1 text-xs leading-snug text-slate-400/75">
                  {item.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* 2. Practical approach */}
      <Reveal direction="up">
        <section className="section-shell py-10 md:py-16">
          <div className="mx-auto max-w-5xl">
            <SectionHeading label="הגישה" sub="המטרה: ללמוד להשתמש ב AI כדי ליצור תוצאות אמיתיות ולפתור צרכים עסקיים בפועל.">
              זו לא עוד הדרכת AI כללית
            </SectionHeading>

            <div className="grid gap-4 md:grid-cols-3">
              {approachPoints.map((point, index) => (
                <div key={point.title} className="glass-card p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                    0{index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {point.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-300">
                    {point.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* 3. Three training areas */}
      <section id="areas" className="section-shell scroll-mt-20 py-10 md:py-16">
        <SectionHeading
          label="שלושה תחומי הדרכה"
          sub="בוחרים נקודת התחלה אחת, או בונים יחד מסלול שמשלב כמה תחומים."
        >
          איפה AI יכול לעבוד בשבילך?
        </SectionHeading>

        <div className="grid gap-5 lg:grid-cols-3">
          {areas.map((area) => (
            <Reveal key={area.id} direction="up" className="h-full">
              <article
                className={`group relative flex h-full flex-col overflow-hidden rounded-[30px] border p-6 shadow-[0_20px_70px_rgba(2,6,23,0.4)] backdrop-blur-xl transition duration-300 md:p-7 ${area.card}`}
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full blur-[70px] ${area.glow}`}
                />

                <div className="relative flex items-center justify-between">
                  <span className="text-5xl">{area.icon}</span>
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-semibold ${area.badge}`}
                  >
                    {area.number}
                  </span>
                </div>

                <h3 className="relative mt-5 text-2xl font-semibold leading-snug text-white md:text-[1.7rem]">
                  {area.title}
                </h3>
                <p className="relative mt-3 text-base leading-7 text-slate-200">
                  {area.audience}
                </p>

                <ul className="relative mt-5 flex-1 space-y-3">
                  {area.topics.map((topic) => (
                    <li
                      key={topic}
                      className="flex items-start gap-3 text-base leading-7 text-slate-300"
                    >
                      <span
                        className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ${area.dot}`}
                      />
                      {topic}
                    </li>
                  ))}
                </ul>

                <a
                  href="#lead-form"
                  className={`relative mt-7 inline-flex items-center justify-center rounded-full border px-5 py-3 text-center text-base font-semibold transition ${area.button}`}
                >
                  רוצה לשמוע עוד על התחום הזה
                </a>
              </article>
            </Reveal>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-7 text-slate-400">
          אלו קטגוריות כלליות. התוכן המפורט נקבע יחד איתך לפי העסק והצרכים שלך.
        </p>
      </section>

      {/* 4. Examples */}
      <Reveal direction="up">
        <section className="section-shell py-10 md:py-16">
          <SectionHeading label="דוגמאות" sub="אלה סוגי הדברים שאפשר ללמוד ליצור במהלך ההדרכה, בהתאם לצורך של העסק.">
            מה אפשר ללמוד ליצור?
          </SectionHeading>

          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {examples.map((item) => (
              <div
                key={item.text}
                className="glass-card flex flex-col items-center gap-3 p-4 text-center md:p-6"
              >
                <span className="text-4xl">{item.icon}</span>
                <p className="text-sm leading-6 text-slate-200 md:text-base">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 5. Process */}
      <section id="process" className="section-shell scroll-mt-20 py-10 md:py-16">
        <SectionHeading label="איך זה עובד" sub="ההדרכה אישית ו 1:1, ומותאמת לכל עסק ולצרכים שלו.">
          תהליך אישי, מעשי ומותאם
        </SectionHeading>

        <ol className="mx-auto grid max-w-5xl gap-4 md:grid-cols-4">
          {processSteps.map((step, index) => (
            <li key={step.title} className="glass-card relative p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-400/30 text-lg font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-300">
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <CtaLink />
        </div>
      </section>

      {/* 6. Instructor */}
      <Reveal direction="up">
        <section id="about" className="section-shell scroll-mt-20 py-10 md:py-16">
          <div className="mx-auto max-w-5xl">
            <SectionHeading label="למה ללמוד דווקא איתי?">
              נעים מאוד, אני מארק
            </SectionHeading>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="glass-card p-6 md:p-8">
                <h3 className="text-3xl font-semibold text-white">
                  מארק זוסמנוביץ׳
                </h3>

                <p className="mt-4 text-lg leading-8 text-slate-300 md:text-xl">
                  מרצה ומעצב שיווק ומוניטיזציה עם למעלה מ 20 שנות ניסיון.
                  המטרה שלי היא לעזור לך להפוך את כלי ה AI לכלים מעשיים שעובדים בשביל העסק שלך בפועל.
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

                <div className="glass-card p-5">
                  <p className="text-sm leading-7 text-slate-50">
                    ״במקום להוציא אלפי שקלים, על ימי צילום, צוותים והפקות, אפשר
                    לייצר היום תכנים איכותיים תוך דקות... המטרה היא מחשבה על הגדלת ההכנסות של העסק.״
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
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

      {/* 7. Testimonials */}
      <section className="section-shell py-10 md:py-16">
        <SectionHeading label="המלצות">
          מה אומרים אנשים שלמדו לעבוד חכם עם AI
        </SectionHeading>

        <div className="mx-auto max-w-5xl">
          <TestimonialCarousel items={testimonials} />
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="section-shell scroll-mt-20 py-10 md:py-16">
        <SectionHeading label="F.A.Q">שאלות נפוצות</SectionHeading>

        <div className="mx-auto max-w-5xl">
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="section-shell py-10 md:py-16">
        <div className="mx-auto max-w-3xl rounded-[34px] border border-cyan-300/20 bg-gradient-to-b from-cyan-400/10 to-violet-400/10 p-8 text-center md:p-12">
          <h2 className="text-[2rem] font-semibold leading-tight text-white md:text-5xl">
            בוא נבדוק איפה AI יכול לעזור לעסק שלך
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-200 md:text-xl">
            בשיחת ייעוץ קצרה נבין מה העסק שלך צריך, ונמליץ על מסלול הדרכה מתאים:
            שיווק ותוכן, אוטומציה או בניית כלים דיגיטליים.
          </p>
          <div className="mt-8">
            <CtaLink />
          </div>
        </div>
      </section>

      {/* 10. Contact form (logic unchanged) */}
      <section
        id="lead-form"
        ref={leadFormRef}
        className="section-shell scroll-mt-28 pb-6 pt-4 md:pb-10"
      >
        <div className="mx-auto max-w-3xl glass-card p-6 md:p-8">
          <h2 className="mb-6 text-center text-2xl font-semibold text-white md:text-3xl">
            השאירו פרטים ואחזור אליכם
          </h2>
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
                placeholder="יועץ / מטפל / מאמן / מעצב / בעל סטודיו..."
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
              {isSubmitting ? "שולח..." : "אני רוצה שיחת ייעוץ ללא עלות"}
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

      <footer className="section-shell border-t border-white/10 pb-24 pt-4 text-center text-sm text-slate-500 md:pb-10">
        כל הזכויות שמורות למארק זוסמנוביץ׳ ReMark 2026 ©
      </footer>
    </main>
  );
}
