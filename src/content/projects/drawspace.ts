import cardImage from '@/assets/images/projects/drawspace/card.jpg';
import type { Project } from './types';

export const DRAWSPACE: Project = {
  id: 'drawspace',
  cardTitle: 'DrawSpace',
  kind: 'Diagram canvas',
  group: 'apps',
  liveUrl: 'https://drawspace.app.space',
  panel: { kind: 'screenshot', src: cardImage },
  cardDescription:
    'An infinite diagramming canvas with pen, shape, arrow and text tools that render in a hand-drawn style, organised into files and folders with zoom and full undo history.',
  cardTags: ['React', 'Canvas', 'Diagramming'],
  keyFeatures: [
    'Pen, rectangle, diamond, ellipse, arrow, line and text tools',
    'Hand-drawn rendering style for shapes, connectors and labels',
    'Infinite pannable canvas with zoom controls and full undo / redo',
    'File and folder organisation across multiple canvases, plus a trash bin',
    'Search across saved canvases and account sync between devices',
  ],
  technologies: ['React', 'TypeScript', 'Canvas API', 'SVG'],
  caseStudy: {
    hero: {
      src: cardImage,
      alt: 'DrawSpace: a flowchart drawn in a hand-drawn style with a file sidebar on the left',
      caption: 'A flowchart on the canvas, files and folders in the sidebar',
    },
    summary:
      'A sketching and diagramming tool built around a hand-drawn rendering style, so a flowchart looks like something worked out on paper rather than generated.',
    sections: [
      {
        heading: 'Why',
        body: [
          'Diagrams made in a tool tend to look finished before the thinking is. A hand-drawn line says “draft” on its own, which makes it easier to share an idea early and easier to throw away. That is the whole premise: a canvas whose default output looks sketched, with just enough structure — shapes that snap, arrows that follow their endpoints — that the sketch stays legible when it is moved around.',
          'The second premise is that diagrams come in sets. One canvas is never the whole picture, so the tool is organised like a workspace: files inside folders, a trash bin, search across everything, and an account so the same files are on every device.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'The tools are the usual set — pen, rectangle, diamond, ellipse, arrow, line and text — and every one of them renders through the same hand-drawn pass, so a rectangle and a freehand stroke share the same wobble. Arrows attach to shapes and follow them when a shape is dragged. The canvas is infinite and pannable, with zoom controls in the corner and full undo and redo on the history.',
          'The drawing surface is the Canvas API, with SVG alongside it, in React and TypeScript. The sidebar on the left is the file system: canvases sit inside folders, deleted ones go to the trash, and search runs across everything saved.',
        ],
      },
      {
        heading: 'Notes',
        body: [
          'DrawSpace is one of the app.space tools built at DeepSpace, in React and TypeScript. It is behind a login, which is why there is a single screenshot here: the canvas view above is the only public capture.',
        ],
      },
    ],
    details: [{ label: 'Context', value: 'DeepSpace' }],
    gallery: [],
  },
};
