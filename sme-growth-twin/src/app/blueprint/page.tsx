import type { Metadata } from "next";

import { BlueprintClient } from "@/components/blueprint/blueprint-client";

export const metadata: Metadata = { title: "Advisor Panel and Blueprint | MajuPilot" };
export default function BlueprintPage() { return <BlueprintClient />; }
