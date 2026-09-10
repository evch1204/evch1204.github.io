import { useState } from 'react';

function companyInitials(company: string) {
  const cleaned = company.replace(/[.,]/g, '').replace(/-/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter((w) => w.length > 0 && !/^(inc|llc|ltd|co)\.?$/i.test(w));
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  const w = parts[0] ?? cleaned;
  return w.slice(0, 2).toUpperCase() || '?';
}

/**
 * Loads a mark via Google’s public favicon service from the organization’s website domain.
 * LinkedIn does not provide stable, hotlinkable logo URLs to third parties.
 * Pass logoDomain="" for initials-only (no network).
 */
export default function CompanyLogo({
  domain,
  company,
  size = 40,
}: {
  domain?: string;
  company: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (domain === undefined) return null;

  const initials = companyInitials(company);
  const box = (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-[10px] font-bold tracking-tight text-zinc-600"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials}
    </div>
  );

  if (domain === '' || failed) {
    return box;
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-lg border border-zinc-100 bg-white object-contain p-1"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
