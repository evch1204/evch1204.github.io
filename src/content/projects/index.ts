/**
 * The project register. One file per project holds its facts and its own
 * images; this file only puts them in order and answers the page's questions
 * about them.
 */
import { ERGONOMIC_RISK } from './ergonomic-risk';
import { BOOKWITHME } from './bookwithme';
import { RUNNINGMAP } from './runningmap';
import { MOW_YOUR_COMMITS } from './mow-your-commits';
import { DOCS } from './docs';
import { DRAWSPACE } from './drawspace';
import { HAND_TRACKER } from './hand-tracker';
import { NBA_ANALYTICS } from './nba-analytics';
import { GAMING_SCRAPING } from './gaming-scraping';
import type { Project, ProjectGroup } from './types';

export type {
  CardPanel,
  CaseStudy,
  CaseStudySection,
  Figure,
  IllustrationId,
  Project,
  ProjectGroup,
} from './types';

const FEATURED_PROJECT_ID = 'ergonomic-risk' as const;

export const PROJECT_GROUPS: { id: ProjectGroup; label: string }[] = [
  { id: 'apps', label: 'Apps & interfaces' },
  { id: 'data', label: 'Data & systems' },
];

export const groupLabel = (group: ProjectGroup) => PROJECT_GROUPS.find((g) => g.id === group)?.label ?? group;

/** Declaration order is the page's prev / next order: featured, then apps, then data. */
export const PROJECTS: Project[] = [
  ERGONOMIC_RISK,
  BOOKWITHME,
  RUNNINGMAP,
  MOW_YOUR_COMMITS,
  DOCS,
  DRAWSPACE,
  HAND_TRACKER,
  NBA_ANALYTICS,
  GAMING_SCRAPING,
];

export const FEATURED_PROJECT = PROJECTS.find((p) => p.id === FEATURED_PROJECT_ID)!;
const GRID_PROJECTS = PROJECTS.filter((p) => p.id !== FEATURED_PROJECT_ID);

/** Grid projects for one group, in declaration order. */
export const projectsInGroup = (group: ProjectGroup) =>
  GRID_PROJECTS.filter((p) => p.group === group);
