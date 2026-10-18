import { AVAILABLE_CATEGORIES } from './products'

export const TARGET_ROLES = [
  'Software Engineer / Developer',
  'Designer / UI / UX',
  'Product Manager',
  'Student / Learner',
  'Founder / Independent Maker',
  'Data Analyst / Data Scientist',
  'QA / Tester',
  'Marketer / Growth',
  'DevOps / Cloud Engineer',
  'Technical Writer',
  'Researcher / Academic',
]

export const TARGET_INDUSTRIES = [
  'Education & EdTech',
  'Developer Software & Cloud',
  'Productivity & Workplace',
  'Creative & Media',
  'Healthcare & Wellbeing',
  'Finance & Fintech',
  'E-commerce & Retail',
  'AI & Machine Learning',
  'Cybersecurity & Privacy',
  'Social & Community',
  'Gaming & Entertainment',
]

export const TARGET_TECHNOLOGIES = [
  'JavaScript / React',
  'TypeScript',
  'Python',
  'AI / machine learning',
  'Design / UX',
  'Data / analytics',
  'Mobile / iOS / Android',
  'Cloud / DevOps',
  'Rust / Go',
  'Node.js / Backend',
  'Next.js / Full-Stack',
]

// Harmonize available categories with existing profile interests
export const PROFILE_INTERESTS = Array.from(
  new Set([
    ...AVAILABLE_CATEGORIES,
    'Small business',
    'Wellbeing',
  ])
)

export const EXPERIENCE_LEVELS = [
  'Beginner (new to software testing)',
  'Intermediate (regularly test apps & prototypes)',
  'Advanced (deep UX, QA, or technical background)',
]

export const TESTING_DEVICES = [
  'macOS (Apple Silicon / Intel)',
  'Windows PC',
  'Linux Desktop',
  'iOS (iPhone / iPad)',
  'Android Phone / Tablet',
  'Chrome / Web Browser',
]

export const FEEDBACK_FOCUS_AREAS = [
  'UI & Visual Polish',
  'UX Flows & Navigation',
  'Bug & Edge Case Hunting',
  'Performance & Speed',
  'Copywriting & Clarity',
  'Feature Suggestions',
]

export const AVAILABILITY_HOURS = [
  '1-2 hours / week',
  '3-5 hours / week',
  '5+ hours / week',
  'On-demand / As needed',
]

export const DEFAULT_VIEW_OPTIONS = [
  { value: 'explore', label: 'Explore Products (Discover prototypes)' },
  { value: 'activity', label: 'Tester Activity (My enrolled tests)' },
  { value: 'builder', label: 'Builder Dashboard (My product listings)' },
]

export const REMINDER_CADENCE_OPTIONS = [
  { value: 'immediate', label: 'Immediate (< 24 hours)', desc: 'Fast feedback cycle for quick prototypes' },
  { value: 'standard', label: 'Standard (24–72 hours)', desc: 'Balanced time to thoroughly evaluate' },
  { value: 'relaxed', label: 'Relaxed (72+ hours)', desc: 'Take plenty of time before gentle nudge' },
]
