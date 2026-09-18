import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DemoBanner } from "@/components/assessment/demo-banner";

import "./styles.css";

export const metadata: Metadata = {
  title: "SME Growth Twin",
  description:
    "An explainable decision system for SME digital and AI transformation planning.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
