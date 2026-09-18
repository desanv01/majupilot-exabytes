import type { Metadata } from "next";

import { ConsultationClient } from "@/components/consultation/consultation-client";

export const metadata: Metadata = { title: "Request a consultation | SME Growth Twin" };
export default function ConsultationPage() { return <ConsultationClient />; }
