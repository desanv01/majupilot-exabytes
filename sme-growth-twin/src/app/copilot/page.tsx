import type { Metadata } from "next";

import { CopilotClient } from "@/components/copilot/copilot-client";

export const metadata: Metadata = { title: "Transformation Copilot | MajuPilot" };

export default function CopilotPage() {
  return <CopilotClient />;
}
