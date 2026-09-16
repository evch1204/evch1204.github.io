import PillLink from '@/components/PillLink';
import type { ProjectAddress } from '@/pages/projects/addresses';

/** The pills at the top: the primary address solid, the rest outline; a repo-only project's one pill is its repo. */
export default function AddressPill({ address, primary }: { address: ProjectAddress; primary: boolean }) {
  return (
    <PillLink
      size="sm"
      variant={primary ? 'solid' : 'outline'}
      href={address.href}
      className={`min-h-11 min-w-0 whitespace-nowrap md:min-h-0${primary ? ' w-full sm:w-auto' : ''}`}
    >
      <address.Icon size={14} className="shrink-0" />
      <span className="min-w-0 truncate">
        {address.kind === 'live' ? `Open ${address.label}` : primary ? 'View on GitHub' : 'GitHub'}
      </span>
    </PillLink>
  );
}
