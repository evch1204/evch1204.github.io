import cardImage from '@/assets/images/projects/bookwithme/card.jpg';
import bookWithMeHome from '@/assets/images/projects/bookwithme/home.jpg';
import bookWithMeDashboard from '@/assets/images/projects/bookwithme/dashboard.jpg';
import bookWithMeMeetings from '@/assets/images/projects/bookwithme/meetings.jpg';
import type { Project } from './types';

export const BOOKWITHME: Project = {
  id: 'bookwithme',
  cardTitle: 'BookWithMe',
  kind: 'Scheduling',
  group: 'apps',
  liveUrl: 'https://bookwithme.app.space',
  panel: { kind: 'screenshot', src: cardImage },
  cardDescription:
    'Publishes a booking page for a meeting type — duration, description and live availability — so a guest picks a slot in their own time zone and it lands on the host schedule.',
  cardTags: ['React', 'Scheduling', 'Calendar'],
  keyFeatures: [
    'Per-meeting-type booking pages with duration and description',
    'Month calendar that greys out days with no remaining availability',
    'Guest-side time-zone selection, defaulting to the visitor’s own zone',
    'Host schedule view showing what is already booked for a given day',
    'Shareable public link, no account required for the guest',
  ],
  technologies: ['React', 'TypeScript', 'Calendar API', 'Date-fns'],
  caseStudy: {
    hero: {
      src: cardImage,
      alt: 'A BookWithMe booking page for a weekly meeting: the meeting details on the left, a month calendar in the middle and the day’s slots on the right',
      caption: 'The public booking page — meeting details, a month, and the day’s free slots',
    },
    summary:
      'A scheduling tool that turns open calendar availability into a shareable link. The host defines a meeting type; the guest picks a free slot in their own time zone.',
    sections: [
      {
        heading: 'Why',
        body: [
          'Finding a meeting time by email takes three or four round trips and still ends up in the wrong time zone. A booking link removes the back-and-forth: the host says what kind of meeting it is and when they are free, and the guest picks. The design goal was that the guest side needs no account and no explanation — a name, a duration, a calendar with the empty days greyed out, and a list of times in whatever zone the guest is in.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'The host side is a dashboard with six areas: an assistant view, the dashboard itself, event types, meetings, availability and analytics. A new account is walked through three steps — connect Google Calendar so bookings sync and Meet links are generated, create an event type (a meeting template others can book), and set availability, which defaults to Monday to Friday. Each event type gets its own public page and a copyable link.',
          'The guest page shows the meeting’s name, duration and description on the left and a month calendar in the middle; days with no remaining availability are greyed out, and picking a day lists its open slots on the right. The time-zone selector defaults to the visitor’s own zone. A booking lands on the host’s schedule, where the day view shows what is already taken. Dates are handled with date-fns and the host’s calendar through the Calendar API.',
        ],
        figure: {
          src: bookWithMeDashboard,
          alt: 'The BookWithMe host dashboard: up-next meeting, totals for meetings, upcoming, event types and today, a weekly meeting-time chart, a calendar, the booking link with Share and View buttons, and the upcoming schedule',
          caption: 'The host dashboard — totals, the weekly meeting-time chart, the calendar and the booking link',
        },
      },
      {
        heading: 'Notes',
        body: [
          'BookWithMe is one of the app.space tools built at DeepSpace, in React and TypeScript. The Meetings page lists every booking with the guest’s contact, its status (upcoming, past, cancelled) and a details drawer with the meeting’s details, its questions and any additional information the guest left.',
        ],
      },
    ],
    details: [{ label: 'Context', value: 'DeepSpace' }],
    gallery: [
      {
        src: bookWithMeMeetings,
        alt: 'The Meetings page: a table of bookings with profile, contact and status, and a details drawer open on a past meeting with Details, Questions and Additional Information tabs',
        caption: 'Meetings — every booking, filtered by status, with a details drawer',
      },
      {
        src: bookWithMeHome,
        alt: 'The BookWithMe host dashboard, signed out: a sidebar with Assistant, Dashboard, Event types, Meetings, Availability and Analytics, and a Getting Started checklist',
        caption: 'A new account’s getting-started list: connect Google Calendar, create an event type, set availability',
      },
    ],
  },
};
