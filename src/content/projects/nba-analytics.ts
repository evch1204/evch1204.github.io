import nbaTarget from '@/assets/images/projects/nba-analytics/target-correlation.jpg';
import nbaHeatmap from '@/assets/images/projects/nba-analytics/heatmap.jpg';
import nbaTree from '@/assets/images/projects/nba-analytics/tree.jpg';
import type { Project } from './types';
import { GITHUB_URL, SCHOOL } from '@/content/site';

export const NBA_ANALYTICS: Project = {
  id: 'nba-analytics',
  cardTitle: 'NBA Analytics Engine',
  kind: 'Data science',
  group: 'data',
  panel: {
    kind: 'figure',
    figure: {
      src: nbaTarget,
      alt: 'Heatmap of feature correlation with the target rank',
      caption: 'Correlation with the target rank',
    },
  },
  cardDescription:
    'Ranks NBA players from fourteen per-game statistics with a decision tree trained on 2022, tested against the real 2024-25 ranking, and used to score trades.',
  cardTags: ['Python', 'Pandas', 'Scikit-learn', 'NumPy'],
  keyFeatures: [
    'Fourteen per-game features (MPG, PPG, 2PA, 3PA, FTA, TPG and more) predicting a player’s rank',
    'Decision tree and KNN regressors trained on the 2022 season, scored on a hold-out and on 2023-24',
    'Comparison against the actual 2024-25 ranking: share of players within ±30 places, MAE and R²',
    'Tiers by predicted rank — Superstar, Starter, Role Player, Bench',
    'A trade simulator that sums rank on each side and says which team comes out ahead',
  ],
  technologies: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Seaborn'],
  githubUrl: `${GITHUB_URL}/NBA-Statistic-Analysis---184-Proj`,
  caseStudy: {
    hero: {
      src: nbaTarget,
      alt: 'Correlation heatmap of the fourteen features and the target rank; MPG and PPG are −0.92 with rank',
      caption: 'Correlation with the target — minutes and points are −0.92 with rank; turnovers barely register',
    },
    summary:
      'Given a season of box-score statistics, how well can a tree predict where a player lands in the league ranking a year later? A CSCI 184 project in pandas and scikit-learn.',
    sections: [
      {
        heading: 'Why',
        body: [
          'Player rankings are argued about all year, and the arguments are mostly about which statistics should count. This project asks the model version of that question: train on one season’s per-game numbers with the ranking as the target, and see how far the same model gets on the next season. A useful side effect is a number for every player, which is what a trade calculator needs.',
          'It was the final project for CSCI 184 at Santa Clara University, done in a Jupyter notebook with pandas, NumPy, scikit-learn, matplotlib and seaborn.',
        ],
      },
      {
        heading: 'Data',
        body: [
          'Four CSV files. nba2022.csv is the training set: the 2022 season with fourteen features and the rank. NBA2024.csv is the 2023-24 season the model is asked to rank. CurrentMVP.csv adds advanced metrics — Win Shares, WS/48, VORP, BPM and team wins — for the MVP-candidate view, and nba_statistic_2024_rank.csv is the actual 2024-25 ranking used as ground truth.',
          'The fourteen features are minutes per game, turnover percentage, free-throw attempts and percentage, two-point attempts and percentage, three-point attempts and percentage, then points, rebounds, assists, steals, blocks and turnovers per game. The correlation heatmap shows the shape of the problem: MPG and PPG are both −0.92 with rank (a better player has a lower rank number), followed by 2PA and TPG at −0.78, FTA at −0.72 and 3PA at −0.70. Turnover percentage is the only feature that goes the other way, at 0.14. The attempts and the minutes are all strongly correlated with each other, so much of the fourteen is the same signal measured several ways.',
        ],
        figure: {
          src: nbaHeatmap,
          alt: 'Feature-to-feature correlation heatmap on a red-yellow-green scale',
          caption: 'Feature-to-feature correlation — attempts, minutes and points move together',
        },
      },
      {
        heading: 'Models',
        body: [
          'An unbounded DecisionTreeRegressor was the first pass; it scored a test MSE of 14.18 on a 25% hold-out from 2022, which is suspiciously good — a deep tree memorises the year it was trained on. The model I kept is a DecisionTreeRegressor with max_depth = 5, trained on scaled 2022 data. Its first split is minutes per game, and the branches below it are free-throw attempts, three-point attempts, points and turnover percentage, which matches the correlation table.',
          'Applied to 2023-24 and compared with the real 2024-25 ranking, the depth-5 tree puts 44.85% of players within ±30 places, with a mean absolute error of 58.6 and an R² of 0.65. On the 2022 hold-out the same tree scores an MAE of 5.0 and 92.16% within ±10 — that gap between in-distribution and next-season performance is the main finding. (One caveat on the notebook: the print label says ±10, but the tolerance variable used was 30.) A KNeighborsRegressor with k = 5 was the comparison; it agreed with the true ranking for 31.84% of players within ±30, R² 0.64, and had an MSE of 6,100 on the hold-out. A plain LinearRegression was tried and dropped after it predicted negative ranks — an unbounded line extrapolates past the top of the league.',
        ],
        figure: {
          src: nbaTree,
          alt: 'The depth-5 decision tree: the root splits on MPG, then on MPG and FTA, then on 3PA, TO% and PPG',
          caption: 'The depth-5 tree — minutes first, then attempts and points',
        },
      },
      {
        heading: 'Trade simulator',
        body: [
          'Each player gets a tier from their rank: Superstar for a rank of 10 or better, Starter up to 50, Role Player up to 150, Bench otherwise. The simulator takes two lists of names, looks each one up, sums the ranks on each side (lower is better) and reports the totals, the tier of every player involved, and which side wins the trade. It is deliberately simple — no contracts, no positions, no age — so the answer is transparent.',
          'The demo call in the notebook found none of its four example players, because the names in the ranking file were formatted differently from the ones typed in, and reported a “perfectly balanced” 0 – 0 trade. Name matching between the datasets turned out to be its own problem, which is why the repository carries a name_order_mismatches.csv alongside the modified-names files.',
        ],
      },
      {
        heading: 'What I learned',
        body: [
          'Three things. A hold-out from the same season is not a test of a ranking model; the only honest number is the one from the following season, and it was much worse. A bounded target needs a bounded model — the linear regression’s negative ranks were the clearest lesson in the project. And most of the work in a “modelling” project is joining tables: aligning player names across four files took longer than fitting any of the models.',
        ],
      },
    ],
    details: [
      { label: 'Context', value: `CSCI 184, ${SCHOOL}` },
      { label: 'Seasons', value: '2022 → 2023-24 · 2024-25 truth' },
    ],
    gallery: [],
  },
};
