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

      <div className="space-y-8 text-lg md:text-xl leading-8 text-slate-300">
        <section>
          <p>
            אנו מכבדים את פרטיות המשתמשים באתר ומחויבים לפעול בשקיפות ביחס
            לאופן שבו אנו אוספים, משתמשים ושומרים מידע אישי. מדיניות זו מסבירה
            איזה מידע נאסף במסגרת השימוש באתר, למה הוא נאסף, כיצד הוא נשמר,
            למי הוא עשוי להימסר, ואילו זכויות עומדות לך בקשר אליו.
          </p>
          <p className="mt-2 text-base text-slate-400">
            עודכן לאחרונה: 20 בנובמבר 2026
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
            בטופס יצירת הקשר באתר אנו אוספים את הפרטים הבאים:
          </p>
          <ul className="mt-4 list-disc space-y-2 pr-6">
            <li>שם מלא, מספר טלפון וכתובת דוא״ל (שדות חובה).</li>
            <li>תחום העסק או העיסוק (שדה אופציונלי).</li>
            <li>
              האם סימנת את תיבת ההסכמה לקבלת תוכן שיווקי, ואם סימנת: מועד
              ההסכמה וגרסת הנוסח שאישרת.
            </li>
            <li>מועד שליחת הטופס ומזהה פנימי אקראי של הפנייה.</li>
          </ul>
          <p className="mt-4">
            בנוסף, בעת הגלישה באתר עשוי להיאסף מידע טכני ונתוני שימוש, כגון
            כתובת IP, סוג דפדפן ומערכת הפעלה, עמודים שנצפו ומקור ההגעה לאתר,
            על ידי שירות האחסון של האתר ועל ידי Meta Pixel (ראו סעיף 4).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">3. מטרות השימוש במידע</h2>
          <p className="mt-4">
            <strong className="text-white">א. יצירת קשר ומענה לפנייה.</strong>{" "}
            הפרטים שמסרת בטופס ישמשו ליצירת קשר איתך, למענה לפנייתך, לתיאום
            שיחה ולמתן מידע על השירותים. לאחר שליחת הטופס נשלח אליך מייל תודה
            אוטומטי שמאשר את קבלת הפנייה, ונשלחת התראה על הפנייה אלינו. הודעות
            אלה הן הודעות שירות, והן נשלחות גם למי שלא הסכים לקבל תוכן שיווקי.
          </p>
          <p className="mt-4">
            <strong className="text-white">ב. תוכן שיווקי, רק בהסכמה.</strong>{" "}
            רק אם סימנת בטופס, באופן אקטיבי, את תיבת ההסכמה לקבלת דוא״ל עם
            טיפים, מדריכים, ניוזלטרים ועדכונים בנושא AI, שיווק וכלים דיגיטליים,
            נשתמש בכתובת הדוא״ל שלך גם למטרה זו. התיבה אינה מסומנת מראש, וסימונה
            אינו תנאי לשליחת הטופס, לקבלת מענה או לקבלת שירות.
          </p>
          <p className="mt-4">
            <strong className="text-white">ג. שימושים נוספים.</strong>{" "}
            שיפור האתר, מדידה וניתוח סטטיסטי של הפעילות בו, שמירה על אבטחתו
            ועמידה בדרישות הדין.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">4. Meta Pixel ועוגיות</h2>
          <p className="mt-4">
            האתר משתמש ב-Meta Pixel של חברת Meta, אך רק אם אישרת זאת בבאנר
            העוגיות. עד לאישור לא נטען הפיקסל ולא נשלח מידע ל-Meta. אם תבחר
            &quot;דחייה&quot;, הפיקסל לא ייטען, והאתר והטופס ימשיכו לעבוד כרגיל.
          </p>
          <p className="mt-4">
            לאחר אישור, הפיקסל עשוי לאסוף מידע על השימוש שלך באתר, כגון צפייה
            בעמודים, ביצוע פעולה של השארת פרטים ומזהים מקוונים (למשל עוגיות
            של Meta), ולשמש למדידת קמפיינים ולהתאמת פרסום. האתר אינו מעביר ל-Meta
            את הפרטים שמולאו בטופס. את הבחירה אפשר לשנות בכל עת בקישור
            &quot;הגדרות עוגיות&quot; בתחתית העמוד, וגם דרך הגדרות הדפדפן.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">5. איפה המידע נשמר ומי מעבד אותו</h2>
          <p className="mt-4">
            אנו משתמשים בספקים הבאים לצורך תפעול האתר וטיפול בפניות:
          </p>
          <ul className="mt-4 list-disc space-y-2 pr-6">
            <li>
              <strong className="text-white">Vercel</strong> – אחסון והפעלה של
              האתר ושל הטופס.
            </li>
            <li>
              <strong className="text-white">Google Sheets ו-Google Apps Script</strong>{" "}
              – שמירת פרטי הפניות ומצב המיילים שנשלחו בגיליון הנמצא בחשבון
              Google של בעל האתר.
            </li>
            <li>
              <strong className="text-white">Gmail (Google)</strong> – שליחת
              מייל התודה והתראת הפנייה.
            </li>
            <li>
              <strong className="text-white">Meta</strong> – Meta Pixel, כמפורט
              בסעיף 4.
            </li>
          </ul>
          <p className="mt-4">
            אנו לא מוכרים מידע אישי. ייתכן שנמסור מידע אם נהיה חייבים לכך לפי
            דין, צו שיפוטי או הליך משפטי, או לצורך הגנה על זכויותינו.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">6. העברת מידע מחוץ לישראל</h2>
          <p className="mt-4">
            הספקים המפורטים לעיל הם חברות בינלאומיות, ולכן ייתכן שהמידע יאוחסן
            או יעובד גם מחוץ לישראל, בכפוף למדיניות זו ולדין החל.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">7. אבטחת מידע</h2>
          <p className="mt-4">האמצעים שנוקטים בפועל:</p>
          <ul className="mt-4 list-disc space-y-2 pr-6">
            <li>העברת הפרטים מהדפדפן לאתר ומהאתר לגיליון נעשית בחיבור מוצפן (HTTPS).</li>
            <li>החיבור בין האתר לגיליון מוגן במפתח סודי, והגישה לגיליון מוגבלת לבעל האתר.</li>
            <li>המערכת בודקת את תקינות הנתונים שנשלחים אליה לפני שמירתם.</li>
          </ul>
          <p className="mt-4">
            עם זאת, אין אפשרות להבטיח אבטחה מוחלטת, ולכן איננו יכולים להתחייב
            שהאתר או מערכות האחסון יהיו חסינים לחלוטין.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">8. שמירת מידע</h2>
          <p className="mt-4">
            פרטי הפניות נשמרים בגיליון כל עוד הם נחוצים לצורך המטרות שלשמן נאספו
            ולצורך ניהול הקשר עמך, או עד שתבקש למחוק אותם. כרגע אין מחיקה
            אוטומטית של פניות, והמחיקה מתבצעת לפי בקשה או כאשר המידע אינו נחוץ
            עוד. רישום ההסכמה לדיוור (כולל מועדה וגרסת הנוסח) נשמר כל עוד
            ההסכמה בתוקף, כדי שנוכל להוכיח אותה.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">9. דיוור שיווקי והסרה</h2>
          <p className="mt-4">
            תוכן שיווקי יישלח רק למי שנתן לכך הסכמה מפורשת בטופס. מי שלא נתן
            הסכמה יכול להשאיר פרטים ולקבל מענה לפנייתו כרגיל. נכון למועד עדכון
            מדיניות זו אנו אוספים את ההסכמה ושומרים אותה, ולא מופעלת מערכת
            דיוור אוטומטית.
          </p>
          <p className="mt-4">
            אפשר לבטל את ההסכמה ולבקש הסרה מרשימת הדיוור בכל עת, בפנייה בכתובת:{" "}
            <a href="mailto:icxmark@gmail.com" className="text-cyan-300 underline underline-offset-4">
              icxmark@gmail.com
            </a>
            . הודעות שיווקיות שיישלחו בעתיד יכללו זיהוי של השולח ואפשרות פשוטה
            להסרה.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">10. הזכויות שלך</h2>
          <p className="mt-4">
            בהתאם לדין החל, עומדות לך זכויות לעיין במידע האישי שאנו מחזיקים
            עליך, לבקש לתקן מידע שגוי, לבקש למחוק מידע ולהתנגד לשימושים מסוימים
            בו.
          </p>
          <p className="mt-4">
            לצורך מימוש הזכויות ניתן ליצור איתנו קשר בכתובת: <a href="mailto:icxmark@gmail.com" className="text-cyan-300 underline underline-offset-4">
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