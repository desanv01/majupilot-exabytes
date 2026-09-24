import Link from "next/link";

import { Brand } from "@/components/assessment/brand";

const destinations = [
  ["/blueprint", "Blueprint"],
  ["/evidence", "Evidence"],
  ["/copilot", "Copilot"],
  ["/consultation", "Consultation"],
] as const;

export function ProductHeader({ current }: { current: "blueprint" | "evidence" | "copilot" | "consultation" }) {
  return (
    <header className="product-header">
      <div className="product-header-inner">
        <Brand />
        <nav aria-label="Workspace navigation">
          {destinations.map(([href, label]) => {
            const active = href === `/${current}`;
            return <Link href={href} key={href} aria-current={active ? "page" : undefined}>{label}</Link>;
          })}
        </nav>
      </div>
    </header>
  );
}
