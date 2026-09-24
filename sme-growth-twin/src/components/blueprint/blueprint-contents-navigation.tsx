"use client";

import { useEffect, useState } from "react";

export type BlueprintSection = readonly [anchor: string, label: string];

function SectionLinks({ active, sections, startIndex }: { active: string; sections: readonly BlueprintSection[]; startIndex: number }) {
  return sections.map(([anchor, label], index) => (
    <a href={`#${anchor}`} key={anchor} aria-current={active === anchor ? "location" : undefined}>
      <span>{String(startIndex + index + 1).padStart(2, "0")}</span>
      <strong>{label}</strong>
    </a>
  ));
}

export function BlueprintContentsNavigation({ sections }: { sections: readonly BlueprintSection[] }) {
  const [active, setActive] = useState(sections[0]?.[0] ?? "cover");
  const activeIndex = Math.max(0, sections.findIndex(([anchor]) => anchor === active));
  const groups = [
    { label: "Decision", startIndex: 0, items: sections.slice(0, 8) },
    { label: "Plan and delivery", startIndex: 8, items: sections.slice(8, 11) },
    { label: "Review and evidence", startIndex: 11, items: sections.slice(11) },
  ];

  useEffect(() => {
    const targets = sections
      .map(([anchor]) => document.getElementById(anchor))
      .filter((target): target is HTMLElement => Boolean(target));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.01] },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <>
      <aside className="phase06-contents-rail no-print">
        <div className="phase06-contents-heading">
          <strong>Blueprint contents</strong>
          <span>Section {activeIndex + 1} of {sections.length}</span>
        </div>
        <nav aria-label="Blueprint sections">{groups.map((group) => <div className="phase06-contents-group" key={group.label}><p>{group.label}</p><SectionLinks active={active} sections={group.items} startIndex={group.startIndex} /></div>)}</nav>
      </aside>
      <details className="phase06-mobile-contents no-print">
        <summary>Section {activeIndex + 1} of {sections.length}: {sections[activeIndex]?.[1]}</summary>
        <nav aria-label="Blueprint sections on small screens">{groups.map((group) => <div className="phase06-contents-group" key={group.label}><p>{group.label}</p><SectionLinks active={active} sections={group.items} startIndex={group.startIndex} /></div>)}</nav>
      </details>
    </>
  );
}
