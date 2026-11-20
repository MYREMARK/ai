import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { MetaPixelLoader } from "@/components/meta-pixel-loader";
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
        <MetaPixelLoader />      
      {children}</body>
    </html>
  );
}