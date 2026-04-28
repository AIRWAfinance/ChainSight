import Link from 'next/link';

interface BrandProps {
  showBy?: boolean;
}

export function Brand({ showBy = true }: BrandProps) {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-logo">ChainSight</span>
      {showBy && <span className="brand-by">by AIRWA Finance</span>}
    </Link>
  );
}
