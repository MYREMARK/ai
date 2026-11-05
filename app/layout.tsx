import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import Script from "next/script";
import "./globals.css";


const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "הדרכת AI מעשית לבעלי עסקים | ReMark",
  description:
    "הדרכה אישית ומעשית לבעלי עסקים: שיווק ותוכן, אוטומציה ובניית כלים דיגיטליים בעזרת AI. שיחת ייעוץ ללא עלות.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={rubik.className}>
        <Script id="metaPixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2008582006089366');
            fbq('track', 'PageView');
          `}
        </Script>      
      {children}</body>
    </html>
  );
}