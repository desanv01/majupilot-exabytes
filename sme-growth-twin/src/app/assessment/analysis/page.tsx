import type { Metadata } from "next";

import { AnalysisClient } from "@/components/diagnostics/analysis-client";

export const metadata: Metadata = { title: "Analysis | MajuPilot" };

export default function AnalysisPage() {
  return <AnalysisClient />;
}
