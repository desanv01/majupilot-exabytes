import type { Metadata } from "next";

import { RecommendationsClient } from "@/components/recommendations/recommendations-client";

export const metadata: Metadata = { title: "Recommendations | MajuPilot" };

export default function RecommendationsPage() { return <RecommendationsClient />; }
