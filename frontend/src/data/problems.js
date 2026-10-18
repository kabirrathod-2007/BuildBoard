/**
 * BuildBoard Seed Problems & Pre-MVP Validation Data
 */

export const PROBLEM_CATEGORIES = [
  'All categories',
  'Developer Tools',
  'Design',
  'Productivity',
  'Learning',
  'AI & Automation',
  'Collaboration',
  'Open Source',
  'Finance',
  'Other',
]

export const seedProblems = [
  {
    id: 'figma-to-tailwind-variables',
    title: 'Design tokens constantly drift between Figma Variables and Tailwind v4 themes',
    statement:
      'Every time our UI designer updates a spacing scale or brand color in Figma, someone has to manually translate the JSON or CSS variables into our Tailwind CSS configuration. Within two sprints, naming conventions diverge and devs are hardcoding hex values again.',
    workarounds:
      'Exporting tokens via community Figma plugins, running a custom node script that breaks on nested variable modes, and manual code reviews.',
    targetAudience: 'Design system engineers, frontend developers, and product designers',
    targetRoles: ['Designer / UI / UX', 'Software Engineer / Developer'],
    targetIndustries: ['Developer Software & Cloud', 'Creative & Media'],
    proposedConcept:
      'A GitHub Action + lightweight CLI that automatically listens to Figma webhooks, normalizes variable modes (light/dark/high-contrast), and opens an automated PR directly updating `@theme` in Tailwind CSS v4.',
    category: 'Design',
    stage: 'Validating Need',
    maker: 'Elena Rostova',
    creatorEmail: 'elena.design@buildboard.dev',
    validatedBy: [
      'builder@buildboard.dev',
      'tester@buildboard.dev',
      'alex.dev@buildboard.dev',
      'marcus.ui@buildboard.dev',
      'sarah.frontend@buildboard.dev',
    ],
    testerSignups: [
      'alex.dev@buildboard.dev',
      'marcus.ui@buildboard.dev',
    ],
    createdAt: '2026-03-20T14:00:00.000Z',
    comments: [
      {
        id: 'c1',
        authorEmail: 'alex.dev@buildboard.dev',
        authorName: 'Alex Mercer',
        text: 'This is 100% our daily friction. Especially when designers use Figma Modes for themes—our script gets completely confused by aliases.',
        createdAt: '2026-03-21T09:30:00.000Z',
        isMakerReply: false,
      },
      {
        id: 'c2',
        authorEmail: 'elena.design@buildboard.dev',
        authorName: 'Elena Rostova',
        text: 'Thanks Alex! Would you prefer a GitHub Action that submits a PR, or an npx CLI command you run manually before shipping a release?',
        createdAt: '2026-03-21T11:15:00.000Z',
        isMakerReply: true,
      },
      {
        id: 'c3',
        authorEmail: 'marcus.ui@buildboard.dev',
        authorName: 'Marcus Vance',
        text: 'Definitely automated PRs. That way CI tests the diff against our visual regression suite before merging.',
        createdAt: '2026-03-22T16:45:00.000Z',
        isMakerReply: false,
      },
    ],
  },
  {
    id: 'cross-browser-extension-manifest-v3',
    title: 'Debugging service-worker lifecycle terminations in Chrome & Safari Manifest V3 extensions',
    statement:
      'In Manifest V3, background service workers terminate every 30 seconds of inactivity. Simulating long-lived state, storage sync, or SSE connections during local development causes mysterious silent drops that are impossible to inspect in standard devtools without attaching separate debuggers.',
    workarounds:
      'Keeping dummy ports open to artificially prolong worker lifetime, scattering console logs everywhere, and restarting extension processes repeatedly.',
    targetAudience: 'Browser extension builders and indie web hackers',
    targetRoles: ['Software Engineer / Developer', 'Founder / Independent Maker'],
    targetIndustries: ['Developer Software & Cloud', 'Productivity & Workplace'],
    proposedConcept:
      'A lightweight debugging wrapper library (`mv3-telemetry`) that visualizes worker state changes, alerts when a worker is about to terminate with pending queue items, and provides a mock heartbeat for unit test environments.',
    category: 'Developer Tools',
    stage: 'Prototyping',
    maker: 'Kavita Chawla',
    creatorEmail: 'kavita.code@buildboard.dev',
    validatedBy: [
      'builder@buildboard.dev',
      'dev.sam@buildboard.dev',
      'jordan.hack@buildboard.dev',
      'dev.leo@buildboard.dev',
    ],
    testerSignups: [
      'builder@buildboard.dev',
      'dev.sam@buildboard.dev',
    ],
    createdAt: '2026-03-24T10:15:00.000Z',
    comments: [
      {
        id: 'c4',
        authorEmail: 'dev.sam@buildboard.dev',
        authorName: 'Samir Patel',
        text: 'Safari in particular kills the worker even more aggressively than Chrome. If your wrapper can handle both engines, I would use this on all 3 of my extensions.',
        createdAt: '2026-03-25T13:20:00.000Z',
        isMakerReply: false,
      },
    ],
  },
  {
    id: 'student-internship-portfolio-feedback',
    title: 'Computer science students build side projects but get zero code quality feedback from senior engineers',
    statement:
      'Students spend months following tutorials and building portfolio projects for internships. But without senior code reviews, they repeatedly commit anti-patterns, over-engineered state, or poor accessibility that gets them rejected by recruiters without any explanation.',
    workarounds:
      'Begging for code reviews on Reddit /r/learnprogramming or Discord servers where 90% of requests are ignored.',
    targetAudience: 'Undergraduates, boot camp students, and junior self-taught developers',
    targetRoles: ['Student / Learner', 'Software Engineer / Developer'],
    targetIndustries: ['Education & EdTech', 'Community & Social'],
    proposedConcept:
      'A structured code teardown exchange: junior builders request a 15-minute asynchronous architecture audit on a specific 200-line module, and senior mentors earn verified community recognition points for actionable critique.',
    category: 'Learning',
    stage: 'Validating Need',
    maker: 'Devon Hayes',
    creatorEmail: 'devon.mentor@buildboard.dev',
    validatedBy: [
      'tester@buildboard.dev',
      'student.priya@buildboard.dev',
      'lucas.code@buildboard.dev',
      'emma.learndev@buildboard.dev',
      'kai.cs@buildboard.dev',
      'builder@buildboard.dev',
    ],
    testerSignups: [
      'student.priya@buildboard.dev',
      'lucas.code@buildboard.dev',
    ],
    createdAt: '2026-03-27T18:40:00.000Z',
    comments: [
      {
        id: 'c5',
        authorEmail: 'student.priya@buildboard.dev',
        authorName: 'Priya N.',
        text: 'Yes! Having a constraint of reviewing just ONE module or 200 lines makes it so much more likely that a busy engineer will actually say yes.',
        createdAt: '2026-03-28T08:10:00.000Z',
        isMakerReply: false,
      },
      {
        id: 'c6',
        authorEmail: 'devon.mentor@buildboard.dev',
        authorName: 'Devon Hayes',
        text: 'Exactly Priya—the 200-line scoping is key so it feels like a bite-sized 10-minute task rather than a daunting whole-repo code review.',
        createdAt: '2026-03-28T10:05:00.000Z',
        isMakerReply: true,
      },
    ],
  },
  {
    id: 'unstructured-user-interview-synthesis',
    title: 'Synthesizing 40-minute user feedback audio into concrete feature decisions takes half a day',
    statement:
      'Early-stage founders do 5 to 10 customer discovery calls a week. Traditional transcription tools give you a massive wall of text, but categorizing who said what, which pain was urgent, and which feature was just a casual request takes 4+ hours of manual tagging in Notion or spreadsheets.',
    workarounds:
      'Manually jotting bullet points while on the call (distracting), or pasting transcripts into ChatGPT with prompt chains that lose speaker nuances.',
    targetAudience: 'Solo founders, early product managers, and indie hackers',
    targetRoles: ['Founder / Independent Maker', 'Product Manager'],
    targetIndustries: ['Productivity & Workplace', 'Developer Software & Cloud'],
    proposedConcept:
      'A focused interview organizer that ingests raw transcript text, extracts direct user quotes tagged by pain urgency (Blocker vs Nice-to-have), and outputs a structured matrix mapped to your product roadmap.',
    category: 'Productivity',
    stage: 'Concept in Progress',
    maker: 'Claire DuPont',
    creatorEmail: 'claire.founder@buildboard.dev',
    validatedBy: [
      'builder@buildboard.dev',
      'founder.zack@buildboard.dev',
      'maya.pm@buildboard.dev',
    ],
    testerSignups: [
      'founder.zack@buildboard.dev',
      'maya.pm@buildboard.dev',
    ],
    createdAt: '2026-03-29T11:20:00.000Z',
    comments: [
      {
        id: 'c7',
        authorEmail: 'founder.zack@buildboard.dev',
        authorName: 'Zack Thorne',
        text: 'The distinction between "Blocker" vs "Casual wish" is the hardest part when doing it with vanilla LLM prompts. If your tool specializes in separating genuine willingness-to-pay signals from polite feedback, this is gold.',
        createdAt: '2026-03-30T14:15:00.000Z',
        isMakerReply: false,
      },
    ],
  },
]
