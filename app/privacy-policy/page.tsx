"use client";

export default function PrivacyPolicyPage() {
  const handleClose = () => {
    if (window.opener) {
      window.close();
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/";
  };

  return (
    <main className="section-shell py-16 text-right text-white">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">מדיניות פרטיות</h1>

        <button
          type="button"
          onClick={handleClose}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          סגור
        </button>
      </div>

      <div className="space-y-8 text-base leading-8 text-slate-300">
        <section>
          <p>
            אנו מכבדים את פרטיות המשתמשים באתר ומחויבים לפעול בשקיפות ביחס
            לאופן שבו אנו אוספים,
            משתמשים ושומרים מידע אישי. מדיניות זו מסבירה
            איזה מידע נאסף במסגרת השימוש באתר, למה הוא נאסף, כיצד הוא נשמר,
            למי הוא עשוי להימסר, ואילו זכויות עומדות לך בקשר אליו.
          
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">1. מי אנחנו</h2>
          <p className="mt-4">האתר מופעל על ידי מארק זוסמנוביץ׳.</p>
          <p className="mt-2">
            ליצירת קשר בנושאי פרטיות ניתן לפנות לכתובת: <a href="mailto:icxmark@gmail.com" className="text-cyan-300 underline underline-offset-4">
              icxmark@gmail.com
            </a>
          </p>
          <p className="mt-2">טלפון: 054-5623580</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">2. איזה מידע אנו אוספים</h2>
          <p className="mt-4">
            במסגרת השימוש באתר אנו עשויים לאסוף את סוגי המידע הבאים:
          </p>
          <ul className="mt-4 list-disc space-y-2 pr-6">
            <li>פרטים שאתה מוסר בטופס הלידים, כגון שם, טלפון, דוא״ל ותחום עיסוק.</li>
            <li>תוכן הפנייה או ההודעה שאתה שולח לנו.</li>
            <li>
              מידע טכני ונתוני שימוש, כגון כתובת IP, סוג דפדפן, מערכת הפעלה,
              זמני ביקור, עמודים שנצפו, מקור ההגעה לאתר ופעולות שבוצעו בו.
            </li>
            <li>
              מידע הנאסף באמצעות עוגיות (Cookies) וטכנולוגיות דומות לצורכי
              תפעול, מדידה, שיפור ביצועים ופרסום מותאם.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">3. מטרות השימוש במידע</h2>
          <p className="mt-4">
            אנו עשויים להשתמש במידע שנאסף למטרות הבאות:
          </p>
          <ul className="mt-4 list-disc space-y-2 pr-6">
            <li>יצירת קשר איתך בעקבות השארת פרטים או פנייה דרך האתר.</li>
            <li>תיאום שיחת אבחון, בדיקת התאמה ומתן מענה לפניות.</li>
            <li>ניהול תקשורת מול לידים, לקוחות ומתעניינים.</li>
            <li>שיפור האתר, חוויית המשתמש, התכנים והביצועים.</li>
            <li>מדידה, ניתוח סטטיסטי והבנת אפקטיביות של קמפיינים.</li>
            <li>פרסום, רימרקטינג והתאמת מסרים שיווקיים.</li>
            <li>שמירה על אבטחת האתר ומניעת שימוש לרעה.</li>
            <li>עמידה בדרישות הדין.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">
            4. Google Analytics, Meta Pixel ועוגיות
          </h2>
          <p className="mt-4">
            האתר עשוי להשתמש בכלי אנליטיקה, מדידה ופרסום של צדדים שלישיים,
            לרבות Google Analytics ו־Meta Pixel.
          </p>
          <p className="mt-4">
            כלים אלה עשויים לאסוף מידע על השימוש שלך באתר, כגון עמודים שנצפו,
            פעולות שבוצעו, מקור ההגעה לאתר, נתוני גלישה, נתוני מכשיר ומזהים
            מקוונים. מידע זה עשוי לשמש אותנו לצורך ניתוח ביצועים, שיפור האתר,
            מדידת קמפיינים, יצירת קהלים, רימרקטינג והתאמת פרסום.
          </p>
          <p className="mt-4">
            האתר משתמש בעוגיות (Cookies) ובטכנולוגיות דומות לצרכים תפעוליים,
            סטטיסטיים ושיווקיים. ניתן לחסום או למחוק עוגיות דרך הגדרות הדפדפן,
            אך ייתכן שחלק מהפונקציות באתר לא יעבדו באופן מלא.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">5. מסירת מידע לצדדים שלישיים</h2>
          <p className="mt-4">
            אנו לא מוכרים מידע אישי. עם זאת, ייתכן שנשתף מידע עם ספקים ונותני
            שירות הפועלים מטעמנו, ככל שהדבר נדרש לצורך תפעול האתר והשירותים,
            למשל:
          </p>
          <ul className="mt-4 list-disc space-y-2 pr-6">
            <li>שירותי אחסון ושרתים.</li>
            <li>מערכות טפסים, CRM, אוטומציה ודיוור.</li>
            <li>שירותי מדידה ואנליטיקה, כגון Google.</li>
            <li>פלטפורמות פרסום, כגון Meta.</li>
            <li>ספקי אבטחה, תחזוקה ותמיכה טכנית.</li>
          </ul>
          <p className="mt-4">
            בנוסף, אנו עשויים למסור מידע אם נהיה חייבים לעשות כן לפי דין, צו
            שיפוטי, הליך משפטי או לצורך הגנה על זכויותינו.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">6. העברת מידע מחוץ לישראל</h2>
          <p className="mt-4">
            ייתכן שחלק מהמידע יאוחסן או יעובד גם מחוץ לישראל, באמצעות ספקים
            טכנולוגיים בינלאומיים או שירותי ענן. בעצם השימוש באתר ומסירת המידע,
            אתה מסכים לכך שהמידע יועבר, יאוחסן ויעובד גם מחוץ לישראל, בכפוף
            למדיניות זו ולדין החל.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">7. אבטחת מידע</h2>
          <p className="mt-4">
            אנו נוקטים אמצעים סבירים ומקובלים כדי להגן על המידע האישי מפני גישה
            בלתי מורשית, שימוש לרעה, שינוי, אובדן או חשיפה.
          </p>
          <p className="mt-4">
            עם זאת, אין אפשרות להבטיח אבטחה מוחלטת, ולכן איננו יכולים להתחייב
            שהאתר או מערכות האחסון יהיו חסינים לחלוטין.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">8. שמירת מידע</h2>
          <p className="mt-4">
            אנו שומרים מידע אישי רק למשך הזמן הנדרש לצורך המטרות שלשמן נאסף
            המידע, לצורך ניהול קשר עם פונים ולידים, לצורך תיעוד עסקי סביר
            ובהתאם לדרישות הדין.
          </p>
          <p className="mt-4">
            מידע שאינו נחוץ עוד עשוי להימחק, להיארכב או לעבור אנונימיזציה,
            בהתאם לצורך ובהתאם לדין החל.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">9. דיוור שיווקי</h2>
          <p className="mt-4">
            אם תסכים לקבל מאיתנו עדכונים, תכנים או מסרים שיווקיים, אנו עשויים
            לשלוח לך דיוור שיווקי באמצעים המותרים לפי דין.
          </p>
          <p className="mt-4">
            ניתן לבקש בכל עת להפסיק לקבל דיוור שיווקי באמצעות פנייה אלינו
            בכתובת: <a href="mailto:icxmark@gmail.com" className="text-cyan-300 underline underline-offset-4">
              icxmark@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">10. הזכויות שלך</h2>
          <p className="mt-4">
            בהתאם לדין החל, ייתכן שעומדות לך זכויות לעיין במידע אישי שאנו
            מחזיקים עליך, לבקש לתקן מידע שגוי, לבקש למחוק מידע מסוים או להתנגד
            לשימושים מסוימים במידע.
          </p>
          <p className="mt-4">
            לצורך פנייה בנושאים אלה ניתן ליצור איתנו קשר בכתובת: <a href="mailto:icxmark@gmail.com" className="text-cyan-300 underline underline-offset-4">
              icxmark@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">11. שינויים במדיניות</h2>
          <p className="mt-4">
            אנו רשאים לעדכן מדיניות זו מעת לעת. הגרסה המעודכנת תפורסם בעמוד זה
            ותיכנס לתוקף ממועד פרסומה.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">12. יצירת קשר</h2>
          <p className="mt-4">שם: מארק זוסמנוביץ׳</p>
          <p className="mt-2">אימייל: <a href="mailto:icxmark@gmail.com" className="text-cyan-300 underline underline-offset-4">
              icxmark@gmail.com
            </a></p>
          <p className="mt-2">טלפון: 054-5623580</p>
        </section>
      </div>
          <div className="mt-12 flex justify-center">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
        >
          סגור
        </button>
      </div>
    </main>
   
  );
}