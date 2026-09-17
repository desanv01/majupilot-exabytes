import type { Metadata } from "next";

import { ResultsClient } from "@/components/diagnostics/results-client";

export const metadata: Metadata = { title: "Results | SME Growth Twin" };

export default function ResultsPage() {
  return <ResultsClient />;
}
