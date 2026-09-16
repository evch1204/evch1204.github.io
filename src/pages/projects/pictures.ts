import type { CaseStudy, Figure } from '@/content/projects';
import { pad2 } from '@/lib/format';

/** What a picture is, for keys and de-duplication: the image path, or the drawing's id. */
export const pictureKey = (figure: Figure) => figure.src ?? figure.illustration;

/** "02 / 05". */
export const counter = (current: number, total: number) => `${pad2(current + 1)} / ${pad2(total)}`;

/**
 * Every picture the case study shows, once each, in reading order: the hero,
 * the section figures, then whatever content lists only for the gallery. This
 * is the slider's order too. `showGallery` is true when that last run adds a
 * picture the hero and the sections have not already shown — otherwise the
 * gallery would only repeat the filmstrip.
 */
export function casePictures(caseStudy: CaseStudy): { pictures: Figure[]; showGallery: boolean } {
  const seen = new Set<string>();
  const pictures: Figure[] = [];
  let showGallery = false;
  const add = (figure: Figure, fromGallery: boolean) => {
    const key = pictureKey(figure);
    if (seen.has(key)) return;
    seen.add(key);
    pictures.push(figure);
    if (fromGallery) showGallery = true;
  };
  add(caseStudy.hero, false);
  for (const section of caseStudy.sections) if (section.figure) add(section.figure, false);
  for (const figure of caseStudy.gallery) add(figure, true);
  return { pictures, showGallery };
}
