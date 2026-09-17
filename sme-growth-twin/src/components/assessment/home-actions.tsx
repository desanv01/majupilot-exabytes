"use client";

/* eslint-disable react-hooks/set-state-in-effect -- resume availability is client-only */
import Link from "next/link";
import { useEffect, useState } from "react";

import { ASSESSMENT_STORAGE_KEY } from "@/infrastructure/persistence/local-assessment-store";

export function HomeActions() {
  const [resume, setResume] = useState(false);

  useEffect(() => {
    setResume(Boolean(localStorage.getItem(ASSESSMENT_STORAGE_KEY)));
  }, []);

  return (
    <div className="home-actions">
      <Link className="button primary" href="/assessment?new=1">
        Start assessment <span>→</span>
      </Link>
      {resume ? (
        <Link className="button secondary" href="/assessment">
          Resume saved assessment
        </Link>
      ) : null}
    </div>
  );
}
