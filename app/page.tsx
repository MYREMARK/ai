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
  "אני יודע שצריך לפרסם יותר, אבל אין לי זמן לחשוב על רעיונות ופוסטים כל שבוע",
  "אני לא אוהב לפתוח מצלמה, ולכן יצירת סרטונים תמיד נדחית",
  "כל סרטון קטן הופך להתעסקות עם צילום, עריכה, כתוביות ואינסוף תיקונים",
  "ניסיתי ChatGPT וכלי AI, אבל לא הצלחתי להפוך אותם לשיטת תוכן שעובדת לעסק שלי",
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

const trustLine = [
  {
    icon: "📈",
    title: "שוק ה AI",
    value: "$1.42T",
    label: "שוק ה AI העולמי צפוי להגיע לכ 1.42 טריליון דולר עד 2032.",
    note: "תחזית שוק משוערת, לפי Statista",
  },
  {
    icon: "⏱️",
    title: "חיסכון בזמן",
    value: "64%",
    label: "מהעסקים מדווחים ש AI מסייע להם לחסוך בזמן.",
    note: "מקור: הסוכנות לעסקים קטנים ובינוניים, משרד הכלכלה והתעשייה, סקר שימוש בבינה מלאכותית בעסקים, 2025.",
  },
  {
    icon: "💼",
    title: "ניסיון מקצועי",
    value: "20+",
    label: "שנות ניסיון בתעשייה.",
  },
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
  {
    quote:
      "כמי שמגדירה את עצמה כטכנופובית, המפגש עם עולם הבינה המלאכותית היה אתגר לא פשוט. אבל מארק הפך את הלמידה לחוויה מעצימה, מרגיעה ומחבקת.\nהוא ידע להתאים את קצב הלמידה שלי, והנגיש גם את החומר המורכב ביותר בצורה בהירה ופשוטה.\nהסבלנות האינסופית שלו, והיכולת להסביר שוב ושוב בדרכים שונות, הפכו את הטכנולוגיה המורכבת לנגישה ומזמינה עבורי.",
    name: "מאירה עזריאל",
    role: "",
    image: "/meira.webp",
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

function BigHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-4 text-[3rem] font-semibold leading-[1.06] text-white lg:text-[3.8rem] xl:text-[4.25rem]">
      {children}
    </h2>
  );
}

function AreasShowcase() {
  return (
    <div>
      <div className="mx-auto mb-6 max-w-3xl text-center md:mb-5">
        <SectionLabel>שלושה תחומי הדרכה</SectionLabel>
        <h2 className="text-[2.1rem] font-semibold leading-[1.12] text-white md:text-4xl lg:text-[2.6rem]">
          איפה AI יכול לעבוד בשבילך?
        </h2>
        <p className="mt-3 text-lg leading-8 text-slate-300 md:mt-2 md:text-base md:leading-7">
          בוחרים נקודת התחלה אחת, או בונים יחד מסלול שמשלב כמה תחומים.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3 md:gap-3 lg:gap-4">
        {areas.map((area) => (
          <article
            key={area.id}
            className={`relative flex h-full flex-col overflow-hidden rounded-[30px] border p-6 shadow-[0_20px_70px_rgba(2,6,23,0.4)] backdrop-blur-xl md:rounded-[24px] md:p-4 lg:p-5 ${area.card}`}
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full blur-[70px] ${area.glow}`}
            />

            <div className="relative flex items-center justify-between">
              <span className="text-5xl md:text-3xl lg:text-4xl">{area.icon}</span>
              <span
                className={`rounded-full border px-3 py-1 text-sm font-semibold md:px-2.5 md:py-0.5 md:text-xs ${area.badge}`}
              >
                {area.number}
              </span>
            </div>

            <h3 className="relative mt-5 text-2xl font-semibold leading-snug text-white md:mt-3 md:text-lg lg:text-xl">
              {area.title}
            </h3>
            <p className="relative mt-3 text-base leading-7 text-slate-200 md:mt-2 md:text-[0.8rem] md:leading-5 lg:text-sm lg:leading-6">
              {area.audience}
            </p>

            <ul className="relative mt-5 flex-1 space-y-3 md:mt-3 md:space-y-1.5">
              {area.topics.map((topic) => (
                <li
                  key={topic}
                  className="flex items-start gap-3 text-base leading-7 text-slate-300 md:gap-2 md:text-[0.8rem] md:leading-5 lg:text-sm lg:leading-6"
                >
                  <span
                    className={`mt-2.5 h-2 w-2 shrink-0 rounded-full md:mt-2 md:h-1.5 md:w-1.5 ${area.dot}`}
                  />
                  {topic}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-7 text-slate-400 md:mt-3 md:text-xs md:leading-5">
        אלו קטגוריות כלליות. התוכן המפורט נקבע יחד איתך לפי העסק והצרכים שלך.
      </p>
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
    <main className="relative isolate overflow-x-hidden bg-slate-950 pb-36 md:pb-20">
      <div className="space-stars space-stars-global" aria-hidden="true" />

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
          <div className="absolute right-[max(1.5rem,4vw)] top-1/2 w-[min(34rem,calc(100vw-3rem))] -translate-y-1/2">
            <div className="pointer-events-auto rounded-[34px] border border-white/15 bg-slate-950/78 p-7 text-right shadow-[0_24px_90px_rgba(2,6,23,0.62)] backdrop-blur-2xl lg:p-8">
            <div className="mb-4 inline-flex rounded-full border border-white/14 bg-black/50 px-4 py-2 text-sm text-slate-50 backdrop-blur-xl">
              הדרכת AI אישית ומעשית לבעלי עסקים
            </div>
              <h1 className="text-[3.7rem] font-semibold leading-[0.98] text-white lg:text-[4.35rem] xl:text-[4.75rem]">
                הופכים AI
                <br />
                <span className="text-cyan-300">לכלי מעשי</span>             
                
              </h1>

              <p className="mt-6 text-xl leading-8 text-slate-50">
                הדרכה אישית ומעשית שמותאמת לעסק שלך: ליצור תוכן, לשפר שיווק, לחסוך זמן, לבנות אוטומציות וכלים דיגיטליים בעזרת AI.
              </p>

              <div className="mt-8 rounded-[28px] border border-white/14 bg-black/50 p-5 backdrop-blur-xl text-right">
                <p className="text-sm leading-7 text-slate-50">
                  ״במקום להוציא אלפי שקלים, על ימי צילום, צוותים והפקות, אפשר
                  לייצר היום תכנים איכותיים תוך דקות... המטרה היא מחשבה על הגדלת ההכנסות של העסק.״
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
              <div className="mb-4 inline-flex rounded-full border border-white/14 bg-black/50 px-4 py-2 text-sm text-slate-50 backdrop-blur-xl">
                הדרכת AI אישית ומעשית לבעלי עסקים
              </div>

              <h1 className="mt-4 text-[3.05rem] font-semibold leading-[1.02] text-white">
                הופכים AI
                <br />
                <span className="text-cyan-300">לכלי מעשי</span>              
               
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-50">
                הדרכה אישית ומעשית שמותאמת לעסק שלך: ליצור תוכן, לשפר שיווק, לחסוך זמן, לבנות אוטומציות וכלים דיגיטליים בעזרת AI.
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
                  לייצר היום תכנים איכותיים תוך דקות... המטרה היא מחשבה על הגדלת ההכנסות של העסק.״
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[25] h-24 bg-gradient-to-b from-transparent to-[#020617] md:h-32" />
      </section>

        <section className="section-shell relative py-10 md:py-14">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
            {trustLine.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center rounded-[26px] border border-white/10 bg-slate-950/55 px-5 py-7 text-center backdrop-blur-lg shadow-[0_16px_50px_rgba(2,6,23,0.32)]"
              >
                <div className="text-4xl">{item.icon}</div>
                <p className="mt-3 text-sm font-medium tracking-wide text-cyan-200">
                  {item.title}
                </p>
                <div dir="ltr" className="mt-2 text-5xl font-semibold leading-none text-white md:text-6xl">
                  {item.value}
                </div>
                <p className="mt-4 text-base leading-7 text-slate-200">
                  {item.label}
                </p>
                {"note" in item && item.note ? (
                  <p className="mt-3 text-xs leading-5 text-slate-400/80">
                    {item.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

      <div className="space-scene space-scene-before">
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
                זה לא כי אין לך מה להגיד
              </p>
              <p className="mt-3 text-lg text-slate-300">
                זה כי אין לך עדיין מנוע תוכן שעובד בשבילך
              </p>
            </div>
          </div>
        </section>
      </Reveal>
      </div>

      <ScrollVideoRevealSection>
        <AreasShowcase />
      </ScrollVideoRevealSection>

      {/* 2. Practical approach */}
      <div className="space-scene space-scene-after">
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
      </div>

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
