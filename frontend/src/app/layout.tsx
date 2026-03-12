import type { Metadata } from "next";
import { dmSerif, plusJakarta } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoMav — AI Visibility Monitoring",
  description:
    "Track how AI assistants represent your business. Monitor mentions, detect hallucinations, and optimize your visibility across ChatGPT, Gemini, Claude, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSerif.variable} ${plusJakarta.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-btn-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
