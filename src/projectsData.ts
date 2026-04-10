export type Project = {
  id: string;
  cardTitle: string;
  cardDescription: string;
  cardTags: string[];
  modalTitle: string;
  overview: string;
  keyFeatures: string[];
  technologies: string[];
  githubUrl?: string;
  /** Short excerpt for the featured project hero (report-style preview). */
  reportPreview?: string;
};

export const FEATURED_PROJECT_ID = 'ergonomic-risk' as const;

export const PROJECTS: Project[] = [
  {
    id: 'ergonomic-risk',
    cardTitle: 'Ergonomic Risk Detection',
    cardDescription:
      'Wearable EMG and IMU data from controlled repetitive-lifting trials, trained with logistic and random forest models to classify high- vs low-risk biomechanical conditions.',
    cardTags: ['Python', 'EMG', 'IMU', 'Random Forest'],
    modalTitle: 'Ergonomic Risk Detection Research',
    overview:
      'This project investigates binary risk classification during repetitive lifting using surface EMG (biceps and deltoids) and IMU signals. After preprocessing and feature extraction, models including logistic regression and random forest were trained and evaluated for EMG-only and IMU-only pipelines, toward later multimodal fusion for stronger prediction.',
    keyFeatures: [
      'Wearable EMG and IMU data collection under controlled lifting protocols',
      'Feature extraction and comparative modeling (e.g., logistic vs. random forest)',
      'Risk stratification for repetitive tasks and discussion of sensor-specific contributions',
      'Implications for real-time occupational monitoring and future IMU feature work',
    ],
    technologies: ['Python', 'Jupyter', 'Data Analysis', 'Scikit-learn', 'Matplotlib'],
    githubUrl: 'https://github.com/evch1204/EMGT311-ENGR184-Final-Project',
    reportPreview:
      'We collected surface EMG (biceps and deltoids) and IMU data during controlled repetitive lifting and trained models—including logistic regression and random forest—to classify low- vs high-risk conditions from EMG-only and IMU-only feature sets, toward eventual multimodal fusion. Random forest classifiers with EMG features reliably distinguished risk levels by capturing meaningful muscle-activation variation, whereas IMU features showed limited separation between categories in this protocol, exposing gaps in biomechanical signal for IMU under these trials. Together, the results support EMG-driven ML as a viable path to real-time occupational monitoring; next steps include broader cohorts, stronger IMU feature engineering, and careful balance of fatigue manipulation with participant safety.',
  },
  {
    id: 'online-ordering',
    cardTitle: 'Full Stack Online Ordering',
    cardDescription:
      'A high-performance e-commerce engine built with Spring Boot. Features secure JWT-based auth and real-time inventory sync.',
    cardTags: ['Java', 'Spring Boot', 'JWT', 'MySQL'],
    modalTitle: 'Full Stack Online Ordering System',
    overview:
      'A comprehensive e-commerce platform built with Java Spring Boot backend and modern frontend technologies. Features secure user authentication, order management, and real-time inventory tracking for seamless online shopping experiences.',
    keyFeatures: [
      'Secure JWT-based authentication system',
      'Real-time inventory management',
      'Order processing and tracking',
      'Payment integration',
      'Admin dashboard for management',
    ],
    technologies: ['Java 21', 'Spring Boot', 'JWT', 'MySQL', 'React', 'Docker'],
    githubUrl: 'https://github.com/11andyxz/OnlineOrder-backend',
  },
  {
    id: 'gaming-scraping',
    cardTitle: 'Gaming Statistics & Web Scraping',
    cardDescription:
      'Scrapes gaming statistics from online platforms to study player behavior, trends, and competitive patterns.',
    cardTags: ['Python', 'Web Scraping', 'Data Analysis'],
    modalTitle: 'Gaming Statistic/Web Scraping Analysis',
    overview:
      'A data collection and analysis project that scrapes gaming statistics from various online platforms to study player behavior and game performance metrics. Combines web scraping techniques with data analysis to uncover insights about gaming trends, player preferences, and competitive gaming patterns.',
    keyFeatures: [
      'Automated web scraping from gaming platforms',
      'Player behavior analysis',
      'Game performance metrics tracking',
      'Trend analysis and pattern recognition',
      'Competitive gaming insights',
    ],
    technologies: ['Python', 'Web Scraping', 'Data Analysis', 'Data Extraction'],
  },
  {
    id: 'nba-analytics',
    cardTitle: 'NBA Analytics Engine',
    cardDescription:
      'Predictive modeling for basketball performance. Processes massive datasets to uncover hidden player efficiency trends.',
    cardTags: ['Python', 'Pandas', 'Scikit-learn', 'NumPy'],
    modalTitle: 'NBA Statistic Analysis',
    overview:
      'A comprehensive data analysis project that processes NBA player and team statistics to identify performance trends and predictive insights. Utilizes Python data science libraries to create visualizations and statistical models for understanding basketball analytics and player performance patterns.',
    keyFeatures: [
      'Statistical analysis of player performance',
      'Team performance trend analysis',
      'Predictive modeling for game outcomes',
      'Interactive data visualizations',
      'Comprehensive statistical reports',
    ],
    technologies: ['Python', 'Data Analysis', 'Matplotlib', 'Pandas', 'NumPy'],
    githubUrl: 'https://github.com/evch1204/NBA-Statistic-Analysis---184-Proj',
  },
  {
    id: 'valley-verde',
    cardTitle: 'Valley Verde Climate Control',
    cardDescription:
      'IoT environmental monitoring with Arduino and C++ for automated temperature and humidity management.',
    cardTags: ['C++', 'Arduino', 'IoT', 'Embedded'],
    modalTitle: 'Valley Verde Climate Control Device',
    overview:
      'An IoT-based environmental monitoring and control system built with Arduino and C++ for automated climate management. Features real-time temperature and humidity sensing with automated responses to maintain optimal environmental conditions for agricultural or indoor applications.',
    keyFeatures: [
      'Real-time temperature and humidity monitoring',
      'Automated climate control responses',
      'IoT connectivity for remote monitoring',
      'Data logging and analysis',
      'Energy-efficient operation',
    ],
    technologies: ['C++', 'Arduino', 'IoT', 'Sensors', 'Embedded Systems'],
  },
];

export const FEATURED_PROJECT = PROJECTS.find((p) => p.id === FEATURED_PROJECT_ID)!;
export const GRID_PROJECTS = PROJECTS.filter((p) => p.id !== FEATURED_PROJECT_ID);
