export type ProjectImage = {
  file: string;
  label: string;
  alt: string;
  width: number;
  height: number;
};

export type Project = {
  id: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  details: string[];
  stack: string;
  period?: string;
  place?: string;
  privateRepo?: boolean;
  source?: string;
  release?: string;
  imageNote?: string;
  images?: ProjectImage[];
};

export const projects: Project[] = [
  {
    id: 'monstergarage', name: 'MonsterGarage', category: 'Freelance',
    period: 'April – June 2026',
    summary: 'Customers, repair jobs, quotes and invoices for a Marrakech garage.',
    description: 'Built a local web application for Monster Garage / WIDINE MOTORS SERVICES, covering customers, vehicles, repair jobs, quotations, invoices, PDF exports, and staff workflows.',
    details: ['Customer, vehicle, and repair records', 'Quotes, invoices, and PDF exports', 'Python, Flask, and a browser-based interface'],
    stack: 'Python · Flask · PDF exports',
    place: 'monstergarage', privateRepo: true,
    imageNote: 'Application screenshot · empty workshop',
    images: [{ file: 'monstergarage-dashboard', label: 'Workshop dashboard',
      alt: 'MonsterGarage workshop dashboard with navigation for repair jobs, quotations, invoices, customers and vehicles; no customer records are shown.',
      width: 1584, height: 805 }],
  },
  {
    id: 'gitsomething', name: 'GitSomething', category: 'Windows beta',
    summary: 'A native Git client that shows the commands behind your actions.',
    description: 'Built a desktop Git client with a React and TypeScript interface and a Rust/libgit2 engine. The working directory brings file changes, readable diffs, staging and commits together, with a command console that explains Git operations.',
    details: ['Working-tree diffs, staging, commits and branch history', 'GitHub connection and folder-to-repository publishing', 'A practice repository and explanatory command console'],
    stack: 'React · TypeScript · Tauri · Rust',
    source: 'https://github.com/imranelak1/GitSomething',
    release: 'https://github.com/imranelak1/GitSomething/releases',
    imageNote: 'Application screenshots · practice repository',
    images: [
      { file: 'git-working-tree', label: 'Working directory',
        alt: 'GitSomething showing changed files, a staged code diff, commit controls and the Git command console in its practice repository.',
        width: 1440, height: 960 },
      { file: 'git-history', label: 'Branch history',
        alt: 'GitSomething commit history with a branch graph and commit details in a demonstration repository.',
        width: 1440, height: 960 },
    ],
  },
  {
    id: 'forge', name: 'Forge', category: 'In development',
    summary: 'Connect pull requests, CI runs and test results to their evidence.',
    description: 'Designed and built a multi-tenant GitHub analytics platform with signed webhooks, resumable workers, and PostgreSQL row-level security. Forge is in development.',
    details: ['Secure JUnit ingestion and test execution histories', 'Pass-rate metrics and potential-flakiness analysis', 'Next.js, TypeScript, Python, FastAPI, PostgreSQL, and Docker', 'Automated API and UI tests with pytest, Vitest, and Playwright'],
    stack: 'Next.js · FastAPI · PostgreSQL · Docker',
    source: 'https://github.com/imranelak1/forge',
    imageNote: 'Application screenshots · generated demo history',
    images: [
      { file: 'forge-tests', label: 'Test intelligence',
        alt: 'Forge test intelligence view with repository filters, JUnit report coverage and test outcomes from explicitly generated demonstration history.',
        width: 1440, height: 1000 },
      { file: 'forge-overview', label: 'Workspace overview',
        alt: 'Forge workspace overview connecting repository activity, pull requests, CI and deployments in a demonstration organization.',
        width: 1440, height: 1000 },
    ],
  },
  {
    id: 'funclipper', name: 'FunClipper', category: 'Desktop prototype',
    summary: 'Record a replay, trim the moment and browse your clips.',
    description: 'Built a Windows replay recorder with capture controls, a floating system-vitals widget, a quick trim and mute editor, and a web companion for browsing clips. Screenshots use controlled test footage.',
    details: ['Desktop replay capture and recent clips', 'Quick trimming and audio controls', 'A web clip library and floating vitals widget'],
    stack: 'C# · WPF · .NET · FFmpeg',
    source: 'https://github.com/imranelak1/FunClipper',
    imageNote: 'Application screenshots · controlled test footage',
    images: [
      { file: 'funclipper-recorder', label: 'Replay recorder',
        alt: 'FunClipper Windows application with capture-quality controls, Start capture action and a recent-clips list populated with test clips.',
        width: 834, height: 621 },
      { file: 'funclipper-editor', label: 'Clip editor',
        alt: 'FunClipper clip editor displaying generated test footage with trimming and audio controls.',
        width: 744, height: 651 },
    ],
  },
  {
    id: 'neurodive', name: 'Neurodive', category: 'Freelance',
    summary: 'Full-stack development and technical leadership for a discovery and membership platform.',
    description: 'Developed a platform for resources, professional discovery, memberships, and administration, pairing a React and TypeScript interface with a Python/FastAPI backend. My responsibilities also cover the platform’s IT and deployment.',
    details: ['Full-stack developer & technical lead', 'Resource discovery, memberships, and administration', 'React, TypeScript, FastAPI, and SQLAlchemy'],
    stack: 'React · TypeScript · FastAPI · SQLAlchemy', privateRepo: true,
  },
  {
    id: 'codegraph', name: 'codeGraph', category: 'Developer tool',
    summary: 'Understand what a code change puts at risk.',
    description: 'A dependency analyzer for JavaScript and TypeScript. Trace the impact of a change, inspect test coverage, and see which imports could not be resolved.',
    details: ['Dependency maps and change impact', 'Coverage and unresolved imports', 'Web interface, CLI, and GitHub Action'],
    stack: 'TypeScript · Dependency analysis · GitHub Actions', privateRepo: true,
  },
];
