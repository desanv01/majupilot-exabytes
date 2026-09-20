import type { Metadata } from "next";
import { DM_Sans, Libre_Baskerville } from "next/font/google";
import type { ReactNode } from "react";

import { DemoBanner } from "@/components/assessment/demo-banner";

import "./styles.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-libre-baskerville",
  weight: "700",
});

export const metadata: Metadata = {
  title: "MajuPilot",
  description:
    "Evidence-led digital and AI transformation planning for Malaysian SMEs.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${libreBaskerville.variable}`}>
      <body>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
