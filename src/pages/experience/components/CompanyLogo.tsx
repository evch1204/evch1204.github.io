import { useState } from 'react';
import Frame from '@/components/sketch/Frame';

function companyInitials(company: string) {
  const cleaned = company.replace(/[.,]/g, '').replace(/-/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter((w) => w.length > 0 && !/^(inc|llc|ltd|co)\.?$/i.test(w));
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  const w = parts[0] ?? cleaned;
  return w.slice(0, 2).toUpperCase() || '?';
}

/**
 * The organization's mark in a small frame drawn by hand, on a patch of the
 * page's own paper so the rail under it stops at its edge. The mark is loaded
 * via Google's public favicon service from the organization's website domain
 * (LinkedIn does not provide stable, hotlinkable logo URLs to third parties)
 * and shown in grey, pressed into the sheet like the rest of the pencil work.
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

  const initials = domain === '' || failed;
  return (
    <span
      className="sk-frame flex shrink-0 items-center justify-center rounded-[10px] bg-page text-xs font-bold text-pencil ring-4 ring-page"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Frame r={10} weight={1.4} tone={0.7} />
      {initials ? (
        companyInitials(company)
      ) : (
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`}
          alt=""
          width={size}
          height={size}
          className="h-full w-full rounded-[10px] object-contain p-1.5 mix-blend-multiply grayscale contrast-125"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
