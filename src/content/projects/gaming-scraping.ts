import gamingCorr from '@/assets/images/projects/gaming-scraping/correlations.png';
import gamingCorrBinned from '@/assets/images/projects/gaming-scraping/correlations-binned.png';
import gamingKd from '@/assets/images/projects/gaming-scraping/kd-vs-winrate.png';
import gamingScore from '@/assets/images/projects/gaming-scraping/score-vs-winrate.png';
import type { Project } from './types';
import { GITHUB_URL, SCHOOL } from '@/content/site';

export const GAMING_SCRAPING: Project = {
  id: 'gaming-scraping',
  cardTitle: 'Gaming Statistics & Web Scraping',
  kind: 'Data science',
  group: 'data',
  panel: {
    kind: 'figure',
    figure: {
      src: gamingKd,
      alt: 'Scatter plot of kills per death against win rate for about 900 Valorant leaderboard players',
      caption: 'K/D vs. win rate',
    },
  },
  cardDescription:
    'Scrapes ~900 players off the Valorant leaderboard and asks which of their stats actually tracks win rate. K/D does; headshot percentage does not.',
  cardTags: ['Python', 'Web Scraping', 'Data Analysis'],
  keyFeatures: [
    'Scrapes 30 pages × 30 players of the mobalytics.gg Valorant leaderboard with requests and BeautifulSoup',
    'Collects rank, win rate, average score, K/D, kills per round, headshot % and main agent into scores.csv',
    'Bins every stat into five equal-width bins and compares correlations binned versus raw',
    'A hand-written Pearson correlation, so the number is not a library call',
    'Scatter plots and correlation bars in matplotlib',
  ],
  technologies: ['Python', 'Requests', 'BeautifulSoup', 'NumPy', 'Matplotlib'],
  githubUrl: `${GITHUB_URL}/Gaming-Statistic-Web-Scrapping-Analysis`,
  caseStudy: {
    hero: {
      src: gamingCorr,
      alt: 'Bar chart of raw correlation with win rate: average score 0.25, kills per death 0.47, kills per round 0.31, headshot percentage 0.02',
      caption: 'Correlation with win rate, raw — K/D 0.47, kills / round 0.31, average score 0.25, headshot % 0.02',
    },
    summary:
      'Which of the numbers on a Valorant leaderboard actually go with winning? Scrape about 900 players, compute the correlations by hand, and check whether binning changes the answer.',
    sections: [
      {
        heading: 'Why',
        body: [
          'Competitive shooters show players a row of statistics — kill / death ratio, kills per round, average combat score, headshot percentage — and it is not obvious which of them matter. Headshot percentage in particular is treated as a skill badge. This CSCI 185 project asks the plain question: across a lot of high-ranked players, which stat correlates with win rate, and by how much.',
          'The second aim was to do the data collection myself rather than download a dataset, and to write the statistic myself rather than call a library, so that every step of the number could be explained.',
        ],
      },
      {
        heading: 'Scraping',
        body: [
          'The source is the Valorant leaderboard on mobalytics.gg. A loop requests 30 pages with requests, parses each with BeautifulSoup and reads 30 player rows per page — about 900 players in all — pulling rank, win rate, average score, K/D, kills per round, headshot percentage and main agent. The rows are written to scores.csv so the analysis can rerun without touching the site again.',
          'The scraper is tied to the page’s HTML structure, so it breaks when the site changes its markup; the notebook notes this and expects the selectors to be edited. Being polite matters too: a fixed number of pages, one pass, and a saved CSV rather than repeated hits.',
        ],
      },
      {
        heading: 'Analysis',
        body: [
          'Each statistic was binned into five equal-width bins between its minimum and maximum, and the correlation with win rate was computed twice — once on the raw values and once on the bin indices — to see whether coarsening the data changed the ranking of the stats. The correlation is a hand-written Pearson: subtract the means, sum the products, divide by n times the two standard deviations, with a length check first.',
          'Raw correlations with win rate: K/D 0.468, kills per round 0.315, average score 0.255, headshot percentage 0.024. Binned: 0.424, 0.300, 0.219, 0.004. Binning lowers every number a little and changes nothing about the order.',
        ],
        figure: {
          src: gamingCorrBinned,
          alt: 'Bar chart of binned correlation with win rate: average score 0.22, kills per death 0.42, kills per round 0.30, headshot percentage 0.00',
          caption: 'The same four correlations on the binned data — same order, slightly lower',
        },
      },
      {
        heading: 'Findings',
        body: [
          'K/D is the strongest single predictor of win rate in this sample, kills per round is second, and headshot percentage is essentially unrelated to winning — at 0.02 raw and 0.004 binned it is noise. Average score sits in between, which makes sense since it is partly built from kills.',
          'The scatter plots carry the caveat. Win rates pile up at exactly 0%, 50% and 100%, because many leaderboard players had only one or two recorded games at the time of the scrape; a single win reads as 100%. Those rows dilute every correlation and are the main reason the coefficients are modest. A better version would require a minimum number of games before a player counts, and would scrape more than one snapshot.',
        ],
        figure: {
          src: gamingKd,
          alt: 'Scatter of kills per death against win rate; points cluster in rows at 0, 50 and 100 percent',
          caption: 'K/D vs. win rate — the rows at 0, 50 and 100% are players with one or two games',
        },
      },
    ],
    details: [
      { label: 'Context', value: `CSCI 185, ${SCHOOL}` },
      { label: 'Sample', value: '30 pages × 30 players' },
    ],
    gallery: [
      {
        src: gamingScore,
        alt: 'Average score against win rate',
        caption: 'Average score vs. win rate',
      },
    ],
  },
};
