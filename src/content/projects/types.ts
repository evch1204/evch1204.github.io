/** The shapes every project file fills in. Facts live one file per project. */

export type ProjectGroup = 'apps' | 'data';

/**
 * Names a drawing that lives with the projects page. Content refers to it by
 * id; the SVG itself is never imported here.
 */
export type IllustrationId = 'hand-cube';

/** A picture: an imported image, or one of the page's drawings. */
export type Figure = {
  alt: string;
  /** One line under the picture, in mono. */
  caption: string;
} & ({ src: string; illustration?: never } | { illustration: IllustrationId; src?: never });

/** What a card's panel shows: a screenshot fills the window from the top; a figure or drawing sits in it whole. */
export type CardPanel = { kind: 'screenshot'; src: string } | { kind: 'figure'; figure: Figure };

export type CaseStudySection = {
  heading: string;
  /** Paragraphs. */
  body: string[];
  figure?: Figure;
};

export type CaseStudy = {
  /** The picture the page opens on — the one the card's window grows into, and the first slide of its hero. */
  hero: Figure;
  /** One or two sentences under the title. */
  summary: string;
  /** Three to five: why, how it works, results, what was learned. */
  sections: CaseStudySection[];
  /**
   * The page's meta strip, after the Kind and Group rows the page adds from
   * the project itself: context, data, year when known.
   */
  details: { label: string; value: string }[];
  /**
   * Real pictures only, and only ones not already shown as the hero or a
   * section figure. The page's pictures are the hero, the section figures,
   * then these, in that order: that is the hero slider's order, and its
   * filmstrip and gallery. With nothing here beyond what the sections show,
   * there is no gallery — and no slider if the hero is the only picture.
   */
  gallery: Figure[];
};

export type Project = {
  id: string;
  cardTitle: string;
  cardDescription: string;
  cardTags: string[];
  /** The numbered "What it does" list. */
  keyFeatures: string[];
  technologies: string[];
  githubUrl?: string;
  /** Short excerpt for the featured project hero (report-style preview). */
  reportPreview?: string;
  /** Category shown as the card's eyebrow label. */
  kind: string;
  /** Which run of cards the project sits in on the projects page. */
  group: ProjectGroup;
  /** Deployed site. Shown on the card as its bare host name. */
  liveUrl?: string;
  panel: CardPanel;
  caseStudy: CaseStudy;
};
