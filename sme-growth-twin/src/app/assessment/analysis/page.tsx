import type { Metadata } from "next";

import { AnalysisClient } from "@/components/diagnostics/analysis-client";

export const metadata: Metadata = { title: "Analysis | SME Growth Twin" };

export default function AnalysisPage() {
  return <AnalysisClient />;
}
