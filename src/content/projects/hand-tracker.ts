import type { Project } from './types';
import { GITHUB_URL } from '@/content/site';

export const HAND_TRACKER: Project = {
  id: 'hand-tracker',
  cardTitle: 'Hand Tracking 3D Cube',
  kind: 'Computer vision',
  group: 'apps',
  panel: {
    kind: 'figure',
    figure: {
      illustration: 'hand-cube',
      alt: 'Illustration of the hand-tracker’s output: the 21-point hand skeleton and the colour-coded wireframe cube',
      caption: 'The landmark skeleton and the colour-coded cube',
    },
  },
  cardDescription:
    'Maps 21 MediaPipe hand landmarks onto a 3D cube in real time: an open right palm rotates it, a two-finger pinch scales it, with smoothing to kill jitter.',
  cardTags: ['Python', 'MediaPipe', 'OpenCV', 'NumPy'],
  keyFeatures: [
    'Right-palm rotation: hand pitch and yaw drive cube rotation around X and Y',
    'Two-finger pinch scaling using one index finger from each hand',
    'Smoothing algorithms to suppress jitter from frame-to-frame landmark noise',
    'Colour-coded cube edges and live hand-landmark visualisation',
    'Real-time processing straight from the webcam via OpenCV',
  ],
  technologies: ['Python', 'MediaPipe', 'OpenCV', 'NumPy'],
  githubUrl: `${GITHUB_URL}/hand_tracker`,
  caseStudy: {
    hero: {
      illustration: 'hand-cube',
      alt: 'Illustration: the 21 MediaPipe hand landmarks joined as a skeleton, next to a wireframe cube with green front edges, blue back edges and red connecting edges',
      caption: 'Illustration of what the program draws: the landmark skeleton and the colour-coded cube',
    },
    summary:
      'A Python program that controls a wireframe cube with your hands. MediaPipe finds 21 landmarks per hand in the webcam feed; the program turns them into rotation and scale.',
    sections: [
      {
        heading: 'Why',
        body: [
          'The question behind this one is how much work sits between “here are 21 points on a hand” and a control you can actually use. A cube is the simplest object with a visible orientation, so it makes every mistake obvious: if the maths is off, the cube spins the wrong way; if the smoothing is off, it shakes.',
          'The whole thing is one Python file, hand_tracking_cube.py, on top of three libraries: OpenCV for the camera, the window and the drawing; MediaPipe Hands for the landmarks, with two-hand detection on; and NumPy for the matrices. A second file, hand_track_test.py, only checks that the three imports work. It runs at roughly 30 frames a second, with MediaPipe taking about 30 ms of each frame.',
        ],
      },
      {
        heading: 'Gestures',
        body: [
          'Rotation mode starts when the right palm is open, defined as at least four of the five fingers extended. A finger counts as extended when its tip is farther from the wrist (landmark 0) than its base joint, the MCP; the thumb is compared against its IP joint instead, because the thumb’s MCP sits too close to the wrist to be a useful reference. This is a distance test rather than an angle test, which makes it stable when the hand turns.',
          'Scale mode needs both hands. When two hands are visible, the 3D distance between the two index fingertips (landmark 8 on each) becomes the scale, clamped between 0.5× and 3×. Pinch the fingers together and the cube shrinks; spread them and it grows. Quit is the q key.',
        ],
      },
      {
        heading: '3D math',
        body: [
          'Orientation comes from two vectors on the palm. The wrist-to-middle-MCP vector (landmarks 0 → 9) is normalised, and pitch = atan2(z, y) and yaw = atan2(x, y) come off it; roll is atan2 of the index-MCP-to-pinky-MCP vector (5 → 17). Tilting the hand up gives a positive pitch and the cube rotates forward; turning it left gives a positive yaw and the cube turns left.',
          'The cube is eight vertices at ±1 on each axis and twelve edges. Each frame, every vertex goes through the rotation matrices in order — X, then Y, then Z — is multiplied by the base scale of 200 pixels and the gesture scale, and is projected orthographically (no perspective) onto a point centred at 75% of the frame width. The edges are then sorted by their average depth and drawn back to front so the near ones paint on top: the front face is green, the back face blue, the four connecting edges red, with thickness growing from 2 to 4 pixels as an edge comes closer. Vertices are white dots.',
        ],
      },
      {
        heading: 'Smoothing',
        body: [
          'Raw landmark positions jitter by a pixel or two between frames, and atan2 amplifies that into a visible shake. Two filters fix it. An exponential moving average keeps 85% of the previous value and takes 15% of the new one (SMOOTHING_FACTOR = 0.85; the README describes it as an 80 / 20 split, the code says 85 / 15). A dead zone of 0.05 ignores any change smaller than that, so a hand held still produces a cube that is actually still.',
          'The cost is a little lag on fast movements, which is the right trade for a demo. Lighting is the main practical limit — MediaPipe loses the hand in a dark room — and the scale gesture needs both index fingers clearly visible and not overlapping. There are no screenshots of the program in the repository, so the picture at the top of this page is an illustration of what it draws.',
        ],
      },
    ],
    details: [
      { label: 'Input', value: 'Webcam · 21 landmarks × 2 hands' },
      { label: 'Runs', value: 'Python 3.7+ · ~30 FPS' },
    ],
    gallery: [],
  },
};
