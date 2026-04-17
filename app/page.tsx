"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollVideoRevealSection } from "@/components/scroll-video-reveal-section";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { FaqAccordion } from "@/components/faq-accordion";
import { CookieBanner } from "@/components/cookie-banner";
import { Reveal } from "@/components/reveal";
import { InteractiveGlow } from "@/components/interactive-glow";

const painPoints = [
  "נמאס לי להיות המנהל, איש המקצוע וגם המשווק של עצמי",
  "ניסיתי ChatGPT ולא באמת יצא מזה משהו שימושי",
  "אין לי מושג מה לכתוב יותר, נגמרו לי הרעיונות",
  "כל סרטון וכל פוסט תלוי במעצבים ועורכי וידאו והופך לפרויקט",
];

const solutionPoints = [
  "מה באמת רלוונטי לעסק שלך",
  "מה מיותר לחלוטין",
  "איך לעבוד עם AI בצורה שמרגישה טבעית ולא רובוטית",
  "איך לייצר תוכן בלי להיתקע",
  "ואיפה אפשר לחסוך זמן וכסף כבר עכשיו",
];

const trustLine = [
  { icon: "💸", value: "$46B", label: "שוק AI עולמי 2032" },
  { icon: "⏱️", value: "63%", label: "חיסכון בזמן עבודה" },
  { icon: "💼", value: "20+", label: "שנות ניסיון בתעשייה" },
];

const learningTracks = [
  {
    title: "מוח שיווקי",
    text:
      "נבנה יחד מנגנון שמוציא ממך פוסטים, רעיונות וניסוחים בקול המקצועי שלך, כדי שלא תיתקע כל פעם מחדש מול מסך ריק. המטרה היא לייצר שבוע שלם של תוכן בזמן קצר, בלי להרגיש כמו רובוט.",
  },
  {
    title: "פס ייצור ויזואלי",
    text:
      "נלמד לייצר תמונות, קריאייטיבים ותמונות תדמית שנראות מקצועיות ומדויקות לעסק של אדם אחד, בלי ימי צילום, בלי הפקות כבדות ובלי תלות בכל משימה קטנה באנשי מקצוע חיצוניים.",
  },
  {
    title: "אולפן וידאו אוטונומי",
    text:
      "נראה איך להפוך רעיון לסרטון קצר שמוכן לפרסום, גם אם אתה לא אוהב להצטלם וגם אם אין לך זמן להיכנס להפקות. נשתמש בכלים כמו Captions, Kling ו-Flow בצורה פרקטית, כולל Lip-sync בעברית כשזה משרת את המטרה.",
  },
  {
    title: "הקמת דפי נחיתה מהירים",
    text:
      "נבנה עמודי נחיתה שנראים פרימיום וממירים מהר, בעזרת כלים כמו Lovable ו - Base44 בלי לחכות שבועות או להסתבך טכנית ובלי לשלם אלפים על כל עמוד חדש לקמפיין או להצעה שלך.",
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
  "מי שמחפש תהליך פרקטי עם תוצאה מדידה",
  "מי שמבין שבינה מלאכותית יוצרת היא כלי עבודה תפעולי",
  "מי שמוכן להשקיע כדי לעבוד חכם יותר",
  "מי שרוצה להישאר רלוונטי ולהתייעל",
];

const notFits = [
  "מי שמחפש פתרון קסם מיידי",
  "מי שלא מוכן ללמוד ולהתאמן בשביל תוצאות",
  "מי שמעדיף להישאר באזור הנוחות",
  "מי שחושב ש-AI יעשה הכל במקומו מבלי שיצטרך ללמוד",
];

const faqItems = [
  {
    question: "האם אני צריך ידע מוקדם?",
    answer:
      "לא. אני בונה עבורך את התהליכים ומלווה אותך בהטמעה. הדרישה היחידה היא הבנה עסקית ושיווקית של הארגון שלך.",
  },
  {
    question: "מתי אראה את ההחזר על ההשקעה (ROI)?",
    answer:
      'מיידית. כבר אחרי פגישת הפיצוח והאבחון הראשונה, נזהה את ה"דליפות" בעסק ונוכל להחליף משימות שעלו לך אלפי שקלים ולקחו ימים בתהליכים שלוקחים דקות.',
  },
  {
    question: "איך מתבצע התהליך בפועל?",
    answer:
      "זהו לא קורס מוקלט. זהו תהליך ייעוץ והטמעה אישי 1:1, בזום או פרונטלית, שנתפר ספציפית ל-DNA העסקי ולמטרות שלך.",
  },
  {
    question: "האם יש ליווי לאחר סיום ההטמעה?",
    answer:
      "בהחלט. תעשיית ה-AI משתנה מדי שבוע. הלקוחות שלי נהנים מערוץ פתוח איתי להתייעצויות, דיוקים ושדרוג המערכות בהתאם לטכנולוגיות החדשות שיוצאות לשוק.",
  },
];

const floatingNodes = [
  {
    size: "h-36 w-36",
    top: "top-[10%]",
    side: "right-[8%]",
    delay: "[animation-delay:-2s]",
    duration: "[animation-duration:18s]",
  },
  {
    size: "h-20 w-20",
    top: "top-[18%]",
    side: "left-[7%]",
    delay: "[animation-delay:-6s]",
    duration: "[animation-duration:14s]",
  },
  {
    size: "h-24 w-24",
    top: "top-[42%]",
    side: "right-[16%]",
    delay: "[animation-delay:-4s]",
    duration: "[animation-duration:16s]",
  },
  {
    size: "h-16 w-16",
    top: "top-[58%]",
    side: "left-[14%]",
    delay: "[animation-delay:-8s]",
    duration: "[animation-duration:12s]",
  },
  {
    size: "h-28 w-28",
    top: "top-[74%]",
    side: "right-[12%]",
    delay: "[animation-delay:-10s]",
    duration: "[animation-duration:20s]",
  },
  {
    size: "h-14 w-14",
    top: "top-[84%]",
    side: "left-[20%]",
    delay: "[animation-delay:-5s]",
    duration: "[animation-duration:15s]",
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
  return (
    <main className="relative overflow-x-hidden bg-slate-950">
      <CookieBanner onVisibilityChange={setCookieBannerVisible} />
      <a
        href="#lead-form"
        className={`cta-shimmer fixed left-1/2 z-[99999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full px-6 py-4 text-center text-sm font-semibold text-cyan-100 backdrop-blur-xl transition-all duration-300 md:w-auto md:px-7 relative overflow-hidden ${
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

      <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        {floatingNodes.map((node, index) => (
          <div
            key={index}
            className={`absolute ${node.top} ${node.side} ${node.size} tech-float ${node.delay} ${node.duration}`}
          >
            <div className="relative h-full w-full rounded-full border border-cyan-300/10 bg-white/[0.03] backdrop-blur-sm">
              <div className="absolute inset-3 rounded-full border border-white/5" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/15 via-transparent to-fuchsia-400/10 blur-md" />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/70 shadow-[0_0_20px_rgba(103,232,249,0.8)]" />
            </div>
          </div>
        ))}
      </div>

    

      <section className="relative isolate overflow-hidden bg-black min-h-[100svh] md:aspect-video md:min-h-0">        <div className="absolute inset-0 -z-40 bg-[url('/hero-office.png')] bg-cover bg-center" /> 
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
              <div className="flex justify-center">
                <SectionLabel>לעצמאים ופרילנסרים שרוצים לעבוד חכם יותר</SectionLabel>
              </div>
              <h1 className="text-[3rem] font-semibold leading-[1.06] text-white lg:text-[3.2rem]">
                לגרום לבינה
                <br />
                <span className="text-cyan-300">לעבוד עבורך</span>
              </h1>

              <p className="mt-6 text-xl leading-8 text-slate-50">
                בשיחת אבחון קצרה נבין איך הבינה המלאכותית יכולה לעבוד בעסק שלך
                ומה אפשר לשנות כבר השבוע כדי לחסוך זמן יקר ולייצר תכנים שעושים
                תוצאות
              </p>

              <div className="mt-8 rounded-[28px] border border-white/14 bg-black/50 p-6 backdrop-blur-xl">
                <p className="text-base leading-8 text-slate-50">
                  ״במקום להוציא אלפי שקלים, על ימי צילום, צוותים והפקות, אפשר
                  לייצר היום תכנים איכותיים תוך דקות... המטרה היא מחשבה ארוכת
                  טווח על הגדלת ההכנסות של העסק.״
                  <span className="mt-2 block text-sm text-slate-300">
                    {" "}
                    מתוך הראיון עם מארק זוסמנוביץ׳
                  </span>
                </p>

                <div className="mt-5 flex" dir="ltr">
                 <Image
                   src="/the-marker.webp"
                   alt="TheMarker"
                     width={190}
                     height={54}
                     className="h-auto w-[150px] md:w-[180px]"
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
                בשיחת אבחון קצרה נבין איך הבינה המלאכותית יכולה לעבוד בעסק שלך
                ומה אפשר לשנות כבר השבוע כדי לחסוך זמן יקר ולייצר תכנים שעושים
                תוצאות
              </p>

              <div className="mt-8 overflow-hidden rounded-[28px] border border-white/12 bg-black/20 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
                <div className="relative aspect-video">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src="https://player.vimeo.com/video/1163050014?autoplay=1&muted=1&controls=1&loop=1&autopause=0&title=0&byline=0&portrait=0&cc=1&dnt=1"                    title="וידאו הסבר למובייל"
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
                  <span className="mt-2 block text-slate-200">
                    מתוך הראיון עם מארק זוסמנוביץ׳
                  </span>
                </p>

                <div className="mt-5 flex justify-start" dir="ltr">
                  <Image
                    src="/the-marker.webp"
                    alt="TheMarker"
                    width={170}
                    height={48}
                    className="h-auto w-[150px]"
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
              <div className="mt-4 text-base font-medium tracking-[0.08em] text-slate-200 md:text-lg">
                {item.label}
              </div>
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
              זה כי אין לך (עדין) שיטה שעובדת לך
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
                אני לא מלמד “כלים”
              </h2>
              <p className="mt-3 text-xl text-cyan-200">אני בונה איתך דרך עבודה</p>
              <p className="mt-6 text-base leading-8 text-slate-300">
                בשיחת האבחון נבין מה באמת ישרת את העסק שלך, מה מיותר לחלוטין,
                ואיך לגרום ל-AI לעבוד בשבילך בצורה טבעית, יעילה ורווחית.
              </p>

              <div className="mt-8 rounded-3xl border border-cyan-400/15 bg-cyan-400/10 p-5">
                <p className="text-base font-medium text-white">המטרה פשוטה</p>
                <p className="mt-2 text-base leading-7 text-slate-200">
                  לצאת מהשיחה עם כיוון ברור וצעדים מיידיים.
                </p>
                
              </div>
            </div>

            <div className="space-y-4">
              {solutionPoints.map((item, index) => (
                <div key={item} className="glass-card flex items-start gap-4 p-5">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                    0{index + 1}
                  </div>
                  <p className="text-base leading-8 text-slate-200">✔ {item}</p>
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
          <BigHeading>מה אומרים מנהלים ויזמים</BigHeading>
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

              <p className="mt-4 text-base leading-8 text-slate-300">
                מרצה ומעצב שיווק ומוניטיזציה עם למעלה מ 20 שנות ניסיון.
               המטרה שלי היא לסנן עבורך את הרעש ולהטמיע בדיוק את מה שיביא לעסק
                שלך את התוצאה המהירה והרווחית ביותר.
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
                <p className="text-base leading-8 text-slate-200">
                  עבדתי והובלתי תהליכים במשרדי הפרסום הגדולים בישראל,
                  בסטארטאפים ובחברות גיימינג בינלאומיות
                </p>
              </div>

              <div className="glass-card p-5">
                <p className="text-base leading-8 text-slate-200">
                  מרצה לבינה מלאכותית, מיתוג וחשיבה יצירתית באקדמיית נטקראפט
                </p>
              </div>

              <div className="glass-card p-5">
                <p className="text-base leading-8 text-slate-200">
                  מחבר הספר Marketing Creative Hacks שנמכר באמזון עם ביקורות
                  מצוינות
                </p>
                <div className="mt-4 text-base text-amber-300">⭐⭐⭐⭐⭐</div>
              </div>

              <div className="glass-card p-6">
                <p className="text-base leading-8 text-white">
                  עוזר לסטודנטים ועסקים עצמאיים להפסיק להיות תלויים באחרים
                  ולהתחיל לעבוד חכם עם בינה מלאכותית
                </p>
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
          <BigHeading>רוצה לדעת מה יעזור לעסק שלך?</BigHeading>
          <p className="mt-4 text-base leading-8 text-white">
           אם הגעת עד כאן כנראה שהבנת שהרכבת כבר יצאה
והשאלה היחידה היא: 

האם עולים עליה עכשיו או שנשארים מאחור?


לשיחת אבחון קצרה
כדי שנבין איפה העסק שלך נמצא
ואיך בינה מלאכותית
יכולה לשרת אותו
        
          </p>
        </div>
      </section>

      <section
        id="lead-form"
        ref={leadFormRef}
        className="section-shell scroll-mt-28 pb-28 pt-4 md:pb-36"
      >
        <div className="mx-auto max-w-3xl glass-card p-6 md:p-8">
          <form className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm text-slate-300">
                שם מלא
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="השם שלך"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm text-slate-300">
                טלפון
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="050-000-0000"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
                אימייל
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40"
              />
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
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-white px-6 py-4 text-center text-base font-semibold text-slate-950 transition hover:opacity-90"
            >
              קבע לי שיחת אבחון ללא עלות
            </button>

            <p className="text-center text-sm leading-7 text-slate-400">
              שליחת הפרטים מהווה אישור ל
              <a href="/privacy-policy" className="mx-1 text-cyan-300 underline underline-offset-4">
                מדיניות הפרטיות
              </a>
              ולשימוש בפרטים לצורך יצירת קשר, תיאום שיחה, מדידה ופרסום מותאם.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}