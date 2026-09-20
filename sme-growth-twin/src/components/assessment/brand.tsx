import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="MajuPilot home">
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-copy">
        <strong>MajuPilot</strong>
        <small>Your business transformation copilot.</small>
      </span>
    </Link>
  );
}
