import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Resume Checker",
  description: "Analyze resumes with AI for grammar, keywords, ATS optimization, and improvement ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.className} min-h-screen bg-canvas text-ink`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
