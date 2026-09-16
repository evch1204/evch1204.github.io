import cardImage from '@/assets/images/projects/runningmap/card.jpg';
import runningMapHome from '@/assets/images/projects/runningmap/home.jpg';
import runningMapRoute from '@/assets/images/projects/runningmap/route.jpg';
import runningMapMyRoutes from '@/assets/images/projects/runningmap/my-routes.jpg';
import type { Project } from './types';

export const RUNNINGMAP: Project = {
  id: 'runningmap',
  cardTitle: 'RunningMap',
  kind: 'Route planner',
  group: 'apps',
  liveUrl: 'https://runningmap.app.space',
  panel: { kind: 'screenshot', src: cardImage },
  cardDescription:
    'Plot a running route leg by leg on an interactive map — drag a point to fine-tune the line, shift-click to remove it — with live distance and walk, bike or drive pacing as the route grows.',
  cardTags: ['React', 'Mapping', 'Geolocation'],
  keyFeatures: [
    'Tap-to-draw routing with draggable waypoints and shift-click removal',
    'Live distance readout and walk / bike / drive / manual pacing modes',
    'Place search to jump the map to an address or landmark',
    'Parks-nearby lookup and freehand shape drawing for area planning',
    'Accounts for saving routes, with an anonymous mode for one-off planning',
  ],
  technologies: ['React', 'TypeScript', 'MapLibre', 'OpenFreeMap', 'Geolocation API'],
  caseStudy: {
    hero: {
      src: runningMapRoute,
      alt: 'RunningMap planner with a 2.06-mile loop drawn through a city grid: five waypoints, the finish point selected, the parks-nearby panel open and the distance card showing walk pacing',
      caption: 'A 2.06 mi loop, five points in — parks nearby open, walk pacing, ~40 min',
    },
    summary:
      'A browser route planner for runners. Tap the map to drop a start point, keep tapping to extend the line, and watch the distance and time estimate update as you go.',
    sections: [
      {
        heading: 'Why',
        body: [
          'Most running apps plan a route after the fact — they record where you went. I wanted the opposite: decide the distance first, then find a loop that comes to it. That means the planner has to be quick to draw with, quick to correct, and honest about the number, because “about 5K” is the whole point of the exercise.',
          'It also had to work with nothing set up. Opening the site drops you straight into the map as an anonymous user with a one-card hint (tap to drop a start point, drag a point to fine-tune, shift-click to remove it, or search a place to jump there). Signing in only adds saving, so a one-off plan never has to go through an account.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'A route is an ordered list of waypoints. Tapping adds one to the end; each point is draggable afterwards so the line can be nudged onto the right side of a street, and shift-click removes a point without breaking the route in two. The distance readout in the bottom card updates continuously, and the pace model under it switches between walk, bike, drive and manual, changing the time estimate rather than the line.',
          'The toolbar below the readout carries undo, redo and delete, then export and share. Two side tools sit next to the planner: parks nearby, which lists green space around the current view, and draw a shape, for freehand area planning when the route is not a line at all. Search in the top-right jumps the map to an address or landmark, and the locate button centres on the browser’s geolocation.',
        ],
      },
      {
        heading: 'Under the hood',
        body: [
          'The map is MapLibre GL with OpenFreeMap tiles — the attribution in the corner reads OpenFreeMap © OpenMapTiles, data from OpenStreetMap — so there is no per-tile billing key in the app. The route, its waypoints and the freehand shapes are drawn on the map from React state, and distance is summed over the legs as they change. The locate button uses the browser’s Geolocation API.',
          'The app is React and TypeScript, built at DeepSpace alongside the other app.space tools. Routes belong to an account when there is one; the anonymous mode keeps the planner usable without signing in.',
        ],
      },
      {
        heading: 'Notes',
        body: [
          'Two gestures carry most of the editing — drag a point to adjust the line, shift-click a point to remove it — and the hint card on first open exists so they are discoverable. Saved routes collect on a My Routes page as small map thumbnails with their distance and pacing, each with a Run it button; runs recorded against them show up under Recent activities.',
        ],
        figure: {
          src: runningMapMyRoutes,
          alt: 'The My Routes page: four saved routes as map thumbnails with their distance and walk, bike or drive pacing, each with a Run it button',
          caption: 'My Routes — saved loops with their distance, pacing and a Run it button',
        },
      },
    ],
    details: [
      { label: 'Context', value: 'DeepSpace' },
      { label: 'Map', value: 'MapLibre · OpenFreeMap' },
    ],
    gallery: [
      {
        src: runningMapHome,
        alt: 'RunningMap planner on first open, signed out: a map of North America with a hint card that says tap the map to drop your start point',
        caption: 'Planner, first open — the hint card explains the three gestures',
      },
    ],
  },
};
