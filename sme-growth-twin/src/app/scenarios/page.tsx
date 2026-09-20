import type { Metadata } from "next";

import { ScenariosClient } from "@/components/scenarios/scenarios-client";

export const metadata: Metadata = { title: "Scenario and ROI Lab | MajuPilot" };

export default function ScenariosPage() { return <ScenariosClient />; }
