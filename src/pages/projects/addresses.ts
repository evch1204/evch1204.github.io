import { ExternalLink, Github, type LucideIcon } from 'lucide-react';
import type { Project } from '@/content/projects';
import { hostLabel, repoLabel } from '@/lib/url';

export type ProjectAddress = {
  kind: 'live' | 'repo';
  href: string;
  /** The bare host or the repo path — what the address reads as in mono. */
  label: string;
  Icon: LucideIcon;
};

/**
 * A project's real addresses, the live site first: the one derivation behind
 * the card's address, the page's pills and the note beside its hero caption.
 */
export function projectAddresses(project: Project): ProjectAddress[] {
  const addresses: ProjectAddress[] = [];
  if (project.liveUrl) {
    addresses.push({ kind: 'live', href: project.liveUrl, label: hostLabel(project.liveUrl), Icon: ExternalLink });
  }
  if (project.githubUrl) {
    addresses.push({ kind: 'repo', href: project.githubUrl, label: repoLabel(project.githubUrl), Icon: Github });
  }
  return addresses;
}
