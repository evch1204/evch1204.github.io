import { useState } from 'react';

function companyInitials(company: string) {
  const cleaned = company.replace(/[.,]/g, '').replace(/-/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter((w) => w.length > 0 && !/^(inc|llc|ltd|co)\.?$/i.test(w));
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  const w = parts[0] ?? cleaned;
  return w.slice(0, 2).toUpperCase() || '?';
}

/**
 * The ring is the page background, so the mark reads as sitting on top of the
 * list rather than in it; the soft shadow lifts it the rest of the way.
 */
const FRAME = 'shrink-0 rounded-[10px] ring-4 ring-[#FAFAFA] shadow-[0_4px_12px_rgba(0,0,0,0.05)]';

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
      className={`${FRAME} flex items-center justify-center border border-zinc-200 bg-white text-[10px] font-bold tracking-tight text-zinc-600`}
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
      className={`${FRAME} border border-zinc-200 bg-white object-contain p-1`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
