import type { KeyboardEvent } from 'react';
import {
  GITHUB_URL,
  LINKEDIN_URL,
  MAILTO,
  RESUME_FILENAME,
  RESUME_URL,
} from '@/content/site';
import { triggerDownload } from '@/lib/download';
import type { CtaKind } from './usePhysicsPlayground';

type HomeCtasOptions = {
  /** Armed means the clones handle presses, so the sources must stop firing. */
  armed: boolean;
  onViewProjects?: () => void;
};

/**
 * What each block does when it is tapped, in one table. The falling blocks are
 * plain DOM, so the engine only reports which kind was tapped and every
 * address the site knows stays on this side.
 */
export function useHomeCtas({ armed, onViewProjects }: HomeCtasOptions) {
  const CTA_ACTIONS: Record<CtaKind, () => void> = {
    projects: () => onViewProjects?.(),
    resume: () => triggerDownload(RESUME_URL, RESUME_FILENAME),
    github: () => window.open(GITHUB_URL, '_blank', 'noopener,noreferrer'),
    linkedin: () => window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer'),
    mail: () => {
      window.location.href = MAILTO;
    },
  };

  const runCta = (kind: CtaKind) => CTA_ACTIONS[kind]();

  /**
   * At rest the buttons and social icons are ordinary controls. Once armed they
   * become physics bodies and the clone handles the press instead, so a click on
   * the now-invisible source bails out rather than firing twice.
   */
  const clickCta = (kind: CtaKind) => () => {
    if (armed) return;
    runCta(kind);
  };

  /**
   * The keyboard never reaches a clone, so the sources stay in the tab order and
   * Enter/Space runs the real action whether the playground is armed or not.
   */
  const keyCta = (kind: CtaKind) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    runCta(kind);
  };

  return { runCta, clickCta, keyCta };
}
