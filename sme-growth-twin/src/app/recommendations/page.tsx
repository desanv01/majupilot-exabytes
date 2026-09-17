import type { Metadata } from "next";

import { RecommendationsClient } from "@/components/recommendations/recommendations-client";

export const metadata: Metadata = { title: "Recommendations | SME Growth Twin" };

export default function RecommendationsPage() { return <RecommendationsClient />; }
