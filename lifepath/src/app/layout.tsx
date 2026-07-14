import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifePath — Turn your life into a game",
  description:
    "Describe where you are, where you've been, and where you want to go. LifePath maps a step-by-step path — skills, levels, certifications, courses, budget, and connections — to get you there.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // data-scroll-behavior="smooth" opts into Next's SPA scroll handling (Next 16).
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
