import { Suspense } from "react";
import { AssessmentClient } from "@/components/assessment/assessment-client";
export default function AssessmentPage(){return <Suspense fallback={<main className="loading">Preparing your assessment…</main>}><AssessmentClient/></Suspense>}
