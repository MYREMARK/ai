import Link from "next/link";

const colorGroups = [
  {
    title: "Brand / Accent",
    colors: [
      { name: "Cyan 300", className: "bg-cyan-300", hex: "#67E8F9" },
      { name: "Cyan 400", className: "bg-cyan-400", hex: "#22D3EE" },
      { name: "Red 400", className: "bg-red-400", hex: "#F87171" },
      { name: "Amber 300", className: "bg-amber-300", hex: "#FCD34D" },
    ],
  },
  {
    title: "Backgrounds / Surfaces",
    colors: [
      { name: "Slate 950", className: "bg-slate-950", hex: "#020617" },
      { name: "Slate 900", className: "bg-slate-900", hex: "#0F172A" },
      { name: "White 5%", className: "bg-white/5", hex: "rgba(255,255,255,0.05)" },
      { name: "White 10%", className: "bg-white/10", hex: "rgba(255,255,255,0.10)" },
    ],
  },
  {
    title: "Text",
    colors: [
      { name: "White", className: "bg-white", hex: "#FFFFFF" },
      { name: "Slate 50", className: "bg-slate-50", hex: "#F8FAFC" },
      { name: "Slate 200", className: "bg-slate-200", hex: "#E2E8F0" },
      { name: "Slate 300", className: "bg-slate-300", hex: "#CBD5E1" },
      { name: "Slate 400", className: "bg-slate-400", hex: "#94A3B8" },
      { name: "Slate 500", className: "bg-slate-500", hex: "#64748B" },
    ],
  },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold text-white md:text-3xl">
      {children}
    </h2>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card p-6 md:p-8">
      <h3 className="text-lg font-semibold text-white md:text-xl">{title}</h3>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function CodeLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-cyan-300">
      {children}
    </div>
  );
}

export default function BrandGuidelinesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="section-shell py-10 md:py-14">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/90">
              Brand Guidelines
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-white md:text-6xl">
              מערכת העיצוב של העמוד
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              עמוד עזר להצגת כל הגדלים, הצבעים והרכיבים המרכזיים של המותג כדי
              שיהיה קל לדייק עיצוב ולהתבסס עליו בעמודים עתידיים.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            חזרה לעמוד הראשי
          </Link>
        </div>

        <div className="grid gap-6">
          <Card title="כותרות">
            <div className="space-y-10">
              <div>
                <CodeLabel>text-[3rem] md:text-[4.5rem]</CodeLabel>
                <p className="mb-3 text-sm text-slate-400">Hero / H1</p>
                <h1 className="text-[3rem] font-semibold leading-[1.06] text-white md:text-[4.5rem]">
                  לגרום לבינה
                  <br />
                  <span className="text-cyan-300">לעבוד עבורך</span>
                </h1>
              </div>

              <div>
                <CodeLabel>text-sm</CodeLabel>
                <p className="mb-3 text-sm text-slate-400">Section Label</p>
                <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                  לעצמאים ופרילנסרים שרוצים לעבוד חכם יותר
                </div>
              </div>

              <div>
                <CodeLabel>text-[2.5rem] md:text-[3rem]</CodeLabel>
                <p className="mb-3 text-sm text-slate-400">Big Heading</p>
                <h2 className="text-[2.5rem] font-semibold leading-[1.06] text-white md:text-[3rem]">
                  כנראה שזה כבר נוגע בך
                </h2>
              </div>

              <div>
                <CodeLabel>text-2xl md:text-3xl</CodeLabel>
                <p className="mb-3 text-sm text-slate-400">Sub Heading / H3</p>
                <h3 className="text-2xl font-semibold text-white md:text-3xl">
                  ארכיטקטורת ה-AI שניישם בעסק שלך
                </h3>
              </div>
            </div>
          </Card>

          <Card title="טקסטים">
            <div className="space-y-10">
              <div>
                <CodeLabel>text-lg md:text-xl</CodeLabel>
                <p className="mb-3 text-sm text-slate-400">Body Large</p>
                <p className="text-lg leading-8 text-slate-200 md:text-xl md:leading-9">
                  בשיחת אבחון קצרה נבין איך הבינה המלאכותית יכולה לעבוד בעסק שלך
                  ומה אפשר לשנות כבר השבוע כדי לחסוך זמן יקר ולייצר תכנים
                  שעושים תוצאות.
                </p>
              </div>

              <div>
                <CodeLabel>text-base</CodeLabel>
                <p className="mb-3 text-sm text-slate-400">Body Regular</p>
                <p className="text-base leading-8 text-slate-300">
                  התהליך הזה לא בנוי לטריקים מגניבים ולא לעוד רשימת כלים
                  מבלבלת. אנחנו בונים תשתית עבודה חכמה לעצמאי שמחזיק את העסק על
                  הכתפיים שלו, כדי לחתוך עלויות, לקצר זמני הפקה ולהוציא יותר
                  תוכן בפחות מאמץ.
                </p>
              </div>

              <div>
                <CodeLabel>text-sm</CodeLabel>
                <p className="mb-3 text-sm text-slate-400">Small / Helper Text</p>
                <p className="text-sm leading-7 text-slate-400">
                  שליחת הפרטים מהווה אישור למדיניות הפרטיות ולשימוש בפרטים
                  לצורך יצירת קשר, תיאום שיחה, מדידה ופרסום מותאם.
                </p>
              </div>

              <div>
                <CodeLabel>text-base</CodeLabel>
                <p className="mb-3 text-sm text-slate-400">Quote</p>
                <p className="text-base leading-8 text-slate-50">
                  ״במקום להוציא אלפי שקלים על ימי צילום, צוותים והפקות, אפשר
                  לייצר היום תכנים איכותיים תוך דקות...״
                </p>
              </div>

              <div>
                <CodeLabel>text-xs</CodeLabel>
                <p className="mb-3 text-sm text-slate-400">Micro Copy</p>
                <p className="text-xs leading-6 text-slate-500">
                  * שדה חובה
                </p>
              </div>
            </div>
          </Card>

          <Card title="צבעים">
            <div className="space-y-8">
              {colorGroups.map((group) => (
                <div key={group.title}>
                  <SectionTitle>{group.title}</SectionTitle>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {group.colors.map((color) => (
                      <div
                        key={color.name}
                        className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                      >
                        <div
                          className={`h-20 rounded-2xl border border-white/10 ${color.className}`}
                        />
                        <p className="mt-4 text-base font-medium text-white">
                          {color.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">{color.hex}</p>
                        <p className="mt-2 text-xs text-cyan-300">{color.className}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="כפתורים">
            <div className="space-y-6">
              <div>
                <CodeLabel>text-base</CodeLabel>
                <button className="w-full rounded-full bg-white px-6 py-4 text-base font-semibold text-slate-950 md:w-auto">
                  קבע לי שיחת אבחון ללא עלות
                </button>
              </div>

              <div>
                <CodeLabel>text-sm</CodeLabel>
                <button className="rounded-full border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10">
                  סגור
                </button>
              </div>

              <div>
                <CodeLabel>text-sm</CodeLabel>
                <button className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20">
                  הבנתי
                </button>
              </div>
            </div>
          </Card>

          <Card title="שדות טופס">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <CodeLabel>text-sm</CodeLabel>
                <label className="mb-2 block text-sm text-slate-300">
                  שם מלא <span className="text-red-400">*</span>
                </label>
                <input
                  readOnly
                  value="השם שלך"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none"
                />
              </div>

              <div>
                <CodeLabel>text-sm</CodeLabel>
                <label className="mb-2 block text-sm text-slate-300">
                  אימייל <span className="text-red-400">*</span>
                </label>
                <input
                  readOnly
                  value="name@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none"
                />
              </div>

              <div>
                <CodeLabel>text-sm</CodeLabel>
                <label className="mb-2 block text-sm text-slate-300">
                  טלפון <span className="text-red-400">*</span>
                </label>
                <input
                  readOnly
                  value="050-000-0000"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none"
                />
              </div>

              <div>
                <CodeLabel>text-sm</CodeLabel>
                <label className="mb-2 block text-sm text-slate-300">
                  תחום העסק שלך
                </label>
                <input
                  readOnly
                  value="יועץ / מטפל / מעצב / בעל סטודיו..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none"
                />
              </div>

              <div>
                <CodeLabel>text-sm + error state</CodeLabel>
                <label className="mb-2 block text-sm text-slate-300">
                  מצב שגיאה
                </label>
                <input
                  readOnly
                  value="name@"
                  className="w-full rounded-2xl border border-red-400 bg-slate-950/70 px-4 py-4 text-white outline-none"
                />
                <p className="mt-2 text-sm text-red-400">נא לבדוק שוב את המייל</p>
              </div>
            </div>
          </Card>

          <Card title="כרטיסים / Components">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_55px_rgba(2,6,23,0.24)] backdrop-blur-xl">
                <CodeLabel>text-xs + text-sm / md:text-base</CodeLabel>
                <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-200">
                  מוח שיווקי
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-200 md:text-base md:leading-8">
                  נבנה יחד מנגנון שמוציא ממך פוסטים, רעיונות וניסוחים בקול
                  המקצועי שלך.
                </p>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-slate-950/72 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl">
                <CodeLabel>text-xl + text-base</CodeLabel>
                <p className="text-xl font-semibold text-white">
                  מארק זוסמנוביץ׳
                </p>
                <p className="mt-3 text-base leading-8 text-slate-300">
                  מרצה ומעצב שיווק ומוניטיזציה עם למעלה מ־20 שנות ניסיון.
                </p>
              </div>
            </div>
          </Card>

          <Card title="סקאלת טקסט מהירה">
            <div className="space-y-5">
              <div>
                <CodeLabel>text-xs</CodeLabel>
                <p className="text-xs text-white">דוגמת טקסט text-xs</p>
              </div>
              <div>
                <CodeLabel>text-sm</CodeLabel>
                <p className="text-sm text-white">דוגמת טקסט text-sm</p>
              </div>
              <div>
                <CodeLabel>text-base</CodeLabel>
                <p className="text-base text-white">דוגמת טקסט text-base</p>
              </div>
              <div>
                <CodeLabel>text-lg</CodeLabel>
                <p className="text-lg text-white">דוגמת טקסט text-lg</p>
              </div>
              <div>
                <CodeLabel>text-xl</CodeLabel>
                <p className="text-xl text-white">דוגמת טקסט text-xl</p>
              </div>
              <div>
                <CodeLabel>text-2xl</CodeLabel>
                <p className="text-2xl text-white">דוגמת טקסט text-2xl</p>
              </div>
              <div>
                <CodeLabel>text-3xl</CodeLabel>
                <p className="text-3xl text-white">דוגמת טקסט text-3xl</p>
              </div>
              <div>
                <CodeLabel>text-[3rem]</CodeLabel>
                <p className="text-[3rem] leading-[1.06] text-white">
                  דוגמת טקסט text-[3rem]
                </p>
              </div>
            </div>
          </Card>

          <Card title="מרווחים מוצעים">
            <div className="space-y-5 text-slate-300">
              <p>
                <span className="font-semibold text-white">כותרת ראשית:</span>{" "}
                מרווח עליון 16–24px, line-height צפוף.
              </p>
              <p>
                <span className="font-semibold text-white">טקסט גוף:</span>{" "}
                מרווח 16–24px מתחת לכותרת.
              </p>
              <p>
                <span className="font-semibold text-white">כרטיסים:</span>{" "}
                padding של 20–24px במובייל, 24–32px בדסקטופ.
              </p>
              <p>
                <span className="font-semibold text-white">סקשנים:</span>{" "}
                מרווחים אנכיים של 40–80px לפי חשיבות.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}