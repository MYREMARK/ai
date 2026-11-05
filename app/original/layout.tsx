import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReMark | גרסה מקורית",
  robots: { index: false, follow: false },
};

export default function OriginalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
