import cardImage from '@/assets/images/projects/docs/card.jpg';
import docsHome from '@/assets/images/projects/docs/home.jpg';
import docsEditor from '@/assets/images/projects/docs/editor.jpg';
import type { Project } from './types';

export const DOCS: Project = {
  id: 'docs',
  cardTitle: 'Docs',
  kind: 'Document workspace',
  group: 'apps',
  liveUrl: 'https://docs.app.space',
  panel: { kind: 'screenshot', src: cardImage },
  cardDescription:
    'A document workspace with a searchable library, folders, templates and sharing — documents open into a block editor with live formatting and autosave.',
  cardTags: ['React', 'Rich Text', 'Editor'],
  keyFeatures: [
    'Searchable document library with folders, favourites and an uncategorised bin',
    'Templates for starting a document from a known structure',
    'Block-based editor with live formatting and autosave',
    'Shared-with-me view for documents other people have sent over',
    'Grid and list layouts, sorted by last edited',
  ],
  technologies: ['React', 'TypeScript', 'Rich Text Editor', 'Autosave'],
  caseStudy: {
    hero: {
      src: cardImage,
      alt: 'Docs: a document open in the block editor with the library sidebar on the left',
      caption: 'A document in the editor, the library in the sidebar',
    },
    summary:
      'A writing workspace rather than a single editor: documents live in folders, get favourited, shared and found again, and open into a block editor that saves as you type.',
    sections: [
      {
        heading: 'Why',
        body: [
          'A text editor is easy; the hard part of a docs tool is everything around the document. Where does it go, how do you find it again in a month, who else can see it, and what happens if you close the tab mid-sentence. This project started from those questions, so the library came first and the editor was built to fit it.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'The workspace opens on the library: a search box across everything, a sidebar with Library, Shared with me, Favorites and Uncategorized, and a Folders list beneath. Documents can be shown as a grid or a list and are sorted by last edited. Templates start a document from a known structure instead of a blank page.',
          'Opening a document drops into a block-based editor with live formatting — headings, lists and the usual marks render as you type — and autosave, so there is no save step and closing the tab loses nothing. Sharing puts a document in the other person’s Shared with me view.',
        ],
        figure: {
          src: docsEditor,
          alt: 'A Project Brief template open in the Docs editor: a formatting toolbar with text styles, font size, bold, italic, lists, quotes, links, images and tables, a word and page count in the header, and Share and download buttons',
          caption: 'The editor on the Project Brief template — toolbar, word and page count, Share',
        },
      },
      {
        heading: 'Notes',
        body: [
          'Docs is one of the app.space tools built at DeepSpace, in React and TypeScript. The header keeps a live word count and an estimated page count next to Share and download, so a document’s length is always in view.',
        ],
      },
    ],
    details: [{ label: 'Context', value: 'DeepSpace' }],
    gallery: [
      {
        src: docsHome,
        alt: 'The Docs library, signed out: search, a New Folder tile, Templates and New Document buttons, and grid / list toggles sorted by last edited',
        caption: 'The library — search, folders, templates, grid or list',
      },
    ],
  },
};
