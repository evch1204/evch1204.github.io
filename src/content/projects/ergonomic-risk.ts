import musclePhoto from '@/assets/images/projects/ergonomic-risk/muscle.jpg';
import emgRaw from '@/assets/images/projects/ergonomic-risk/emg-raw.jpg';
import emgRoc from '@/assets/images/projects/ergonomic-risk/roc.jpg';
import emgTree from '@/assets/images/projects/ergonomic-risk/tree.jpg';
import emgAccel from '@/assets/images/projects/ergonomic-risk/accelerometer.jpg';
import type { Project } from './types';
import { GITHUB_URL, SCHOOL } from '@/content/site';

export const ERGONOMIC_RISK: Project = {
  id: 'ergonomic-risk',
  cardTitle: 'Ergonomic Risk Detection',
  kind: 'Research',
  group: 'data',
  panel: {
    kind: 'figure',
    figure: {
      src: musclePhoto,
      alt: 'Logistic regression predictions versus true labels on two PCA components',
      caption: 'Logistic regression on the first two PCA components',
    },
  },
  cardDescription:
    'Wearable EMG and IMU data from controlled repetitive-lifting trials, trained with logistic and random forest models to classify high- vs low-risk biomechanical conditions.',
  cardTags: ['Python', 'EMG', 'IMU', 'Random Forest'],
  keyFeatures: [
    'Wearable EMG and IMU data collection under controlled lifting protocols',
    'Feature extraction and comparative modeling (e.g., logistic vs. random forest)',
    'Risk stratification for repetitive tasks and discussion of sensor-specific contributions',
    'Implications for real-time occupational monitoring and future IMU feature work',
  ],
  technologies: ['Python', 'Jupyter', 'Data Analysis', 'Scikit-learn', 'Matplotlib'],
  githubUrl: `${GITHUB_URL}/EMGT311-ENGR184-Final-Project`,
  reportPreview:
    'We collected surface EMG (biceps and deltoids) and IMU data during controlled repetitive lifting and trained models—including logistic regression and random forest—to classify low- vs high-risk conditions from EMG-only and IMU-only feature sets, toward eventual multimodal fusion. Random forest classifiers with EMG features reliably distinguished risk levels by capturing meaningful muscle-activation variation, whereas IMU features showed limited separation between categories in this protocol, exposing gaps in biomechanical signal for IMU under these trials. Together, the results support EMG-driven ML as a viable path to real-time occupational monitoring; next steps include broader cohorts, stronger IMU feature engineering, and careful balance of fatigue manipulation with participant safety.',
  caseStudy: {
    hero: {
      src: musclePhoto,
      alt: 'Scatter plot of logistic regression predictions versus true labels on the first two PCA components',
      caption: 'Logistic regression: predicted colour vs. true shape on the first two PCA components',
    },
    summary:
      'Can a wearable tell a risky lift from a safe one? Surface EMG and IMU signals from two people, four trials, and two classifiers — one of which worked.',
    sections: [
      {
        heading: 'Why',
        body: [
          'Repetitive lifting is one of the most common causes of workplace injury, and the usual way to assess it is a checklist filled in by an observer. The question for this course project (EMGT 311 / ENGR 184, a group project) was whether cheap wearable sensors could do that assessment continuously instead: strap on a few muscle sensors and a motion unit, and let a model flag when a task has drifted into a high-risk pattern.',
          'We framed it as binary classification. Each trial was recorded under a condition we labelled either low risk or high risk, and the model had to recover that label from short windows of signal alone. The interesting part was not the model choice so much as which sensor carried the information: muscle activation (EMG) or body motion (IMU).',
        ],
      },
      {
        heading: 'Data & sensors',
        body: [
          'Four recordings: Person 1 and Person 2, each doing a high-risk and a low-risk trial. Every file has 56 columns with five rows of metadata at the top. Four surface-EMG sensors sat on the right bicep, right deltoid, left bicep and left deltoid, reporting in millivolts; the IMU units reported acceleration on X, Y and Z in G and gyroscope rates in degrees per second.',
          'The raw EMG traces show what the model is up against. The deltoid channels spike hard during each lift while the biceps barely move off zero, and the difference between a low-risk and a high-risk trial is a matter of how often and how sharply those spikes come, not a different shape of signal. The accelerometer trace tells a similar story: gravity sits on one axis at about 1 G and the lift shows up as a slow swing on the other two.',
        ],
        figure: {
          src: emgRaw,
          alt: 'Four raw EMG traces for Person 1, low-risk trial: the left deltoid spikes repeatedly while the other three channels stay near zero',
          caption: 'Raw EMG, Person 1 low-risk trial — the left deltoid does most of the work',
        },
      },
      {
        heading: 'Method',
        body: [
          'EMG pipeline: fill missing values with the column mean, clip outliers beyond three standard deviations, standardise with StandardScaler, then slide a 100-sample window across each trial in steps of 30. Each window becomes one row with five statistics per sensor — mean, max, min, standard deviation and RMS — so 20 features. Rows were split 70 / 30 with stratification and a fixed seed of 42.',
          'The IMU pipeline used the same windowing but different features: the peak, mean, total and range of the acceleration magnitude, and the same four for the gyroscope magnitude. Two models were fitted to each feature set. Logistic regression with L2 regularisation (liblinear) is the baseline — linear, fast, easy to read. A random forest of 100 trees is the non-linear comparison. Accuracy, a confusion matrix, per-class precision, recall and F1, and a ROC curve for the linear model came out of scikit-learn.',
        ],
        figure: {
          src: emgTree,
          alt: 'The first three levels of one tree from the random forest: splits on Max_EMG_S1, Max_EMG_S2 and Std_EMG_S2',
          caption: 'One tree from the forest, cut at depth 3 — the first split is the right bicep’s peak',
        },
      },
      {
        heading: 'Results',
        body: [
          'Logistic regression on EMG features reached 57.70% accuracy with an AUC of 0.59 — only a little better than a coin toss. Its confusion matrix ([[1030, 951], [734, 1268]]) shows it leaning towards calling things high risk; F1 was 0.55 for low risk and 0.60 for high risk over 1,981 and 2,002 windows. The PCA view at the top of this page is the same story in two dimensions: the classes overlap almost completely along any straight line.',
          'The random forest on the same EMG features reached 0.83 accuracy, with a confusion matrix of [[1682, 299], [374, 1628]] and F1 of 0.83 for both classes (precision 0.82 / 0.84, recall 0.85 / 0.81). Looking at one of its trees explains why: the useful boundaries are thresholds on peak amplitude and spread — Max_EMG_S1 ≤ 4.189, then Max_EMG_S2 ≤ 4.057, then Std_EMG_S2 ≤ 0.093 — which a linear model cannot express.',
          'The IMU pipeline did not work. A random forest on the motion features scored 0.53 accuracy, but with a recall of 0.98 for high risk and 0.08 for low risk ([[176, 1958], [43, 2105]]) — the model had collapsed to calling almost everything high risk. The accelerometer traces suggest why: the lifting motion looks much the same in both conditions, so the magnitude statistics carry little signal.',
        ],
        figure: {
          src: emgRoc,
          alt: 'ROC curve for the logistic regression model, area under the curve 0.59',
          caption: 'ROC of the logistic model, AUC 0.59 — the linear baseline barely separates the classes',
        },
      },
      {
        heading: 'What’s next',
        body: [
          'The honest conclusion is narrower than the headline number. Two people and four trials is a very small dataset, and the 83% comes from windows that overlap in time, so neighbouring rows in the train and test sets are similar. The result says EMG amplitude statistics carry risk information that a tree ensemble can pick up; it does not yet say the model would hold up on a third person.',
          'Next steps we wrote down: a broader cohort, IMU features that describe the shape of a lift (angles, timing) rather than the size of the motion, and — the point that mattered most in the report — a protocol that manipulates fatigue enough to create real risk without putting participants at that risk. Fusing the two sensor streams only makes sense once the IMU side carries signal on its own.',
        ],
      },
    ],
    details: [
      { label: 'Context', value: `EMGT 311 / ENGR 184, ${SCHOOL}` },
      { label: 'Data', value: '2 people · 4 trials · 4 EMG + IMU' },
    ],
    gallery: [
      {
        src: emgAccel,
        alt: 'Accelerometer X, Y and Z traces for Person 1 low-risk trial',
        caption: 'Accelerometer, Person 1 low risk',
      },
    ],
  },
};
