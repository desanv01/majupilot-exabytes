import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="SME Growth Twin home">
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-copy">
        <strong>SME Growth Twin</strong>
        <small>Smarter decisions. Stronger businesses.</small>
      </span>
    </Link>
  );
}
