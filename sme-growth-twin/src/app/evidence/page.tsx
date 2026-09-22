import type { Metadata } from "next";

import { EvidenceLibraryClient } from "@/components/evidence/evidence-library-client";

export const metadata: Metadata = { title: "Evidence Library | MajuPilot" };

export default function EvidenceLibraryPage() {
  return <EvidenceLibraryClient />;
}
