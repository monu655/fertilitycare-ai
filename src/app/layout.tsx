import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Inter is self-hosted (no request to Google from visitors' browsers).
const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FertilityCare AI",
    template: "%s | FertilityCare AI",
  },
  description:
    "Private, evidence-informed male reproductive health education and care navigation. Not a diagnosis or a substitute for a healthcare professional.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
