/**
 * BuildBoard Database Seeder
 * Idempotently populates the database with initial sample products and community problems
 * if the database has zero products.
 */

export const SAMPLE_BUILDERS = [
  {
    email: 'elena.rostova@buildboard.dev',
    displayName: 'Elena Rostova',
    username: 'elena_rostova',
    bio: 'Product designer and frontend builder focusing on calm productivity workflows.',
    roles: ['Designer / UI / UX', 'Founder / Independent Maker'],
    interests: ['Productivity', 'Design'],
    industries: ['Productivity & Workplace', 'Creative & Media'],
    technologies: ['Design / UX', 'JavaScript / React'],
  },
  {
    email: 'marcus.chen@buildboard.dev',
    displayName: 'Marcus Chen',
    username: 'marcus_chen',
    bio: 'Design systems engineer bridging Figma variables to modern CSS and Tailwind.',
    roles: ['Software Engineer / Developer', 'Designer / UI / UX'],
    interests: ['Developer Tools', 'Design'],
    industries: ['Developer Software & Cloud'],
    technologies: ['JavaScript / React', 'TypeScript'],
  },
  {
    email: 'sarah.jenkins@buildboard.dev',
    displayName: 'Sarah Jenkins',
    username: 'sarah_jenkins',
    bio: 'AI engineer building evaluation harnesses for reliable structured generation.',
    roles: ['Software Engineer / Developer', 'Data Analyst / Data Scientist'],
    interests: ['AI & Automation', 'Developer Tools'],
    industries: ['Developer Software & Cloud'],
    technologies: ['AI / machine learning', 'Python'],
  },
  {
    email: 'kavita.rao@buildboard.dev',
    displayName: 'Kavita Rao',
    username: 'kavita_rao',
    bio: 'Backend optimizer and database educator passionate about visual query plans.',
    roles: ['Software Engineer / Developer', 'Student / Learner'],
    interests: ['Developer Tools', 'Learning'],
    industries: ['Developer Software & Cloud', 'Education & EdTech'],
    technologies: ['Data / analytics', 'Cloud / DevOps'],
  },
  {
    email: 'devon.park@buildboard.dev',
    displayName: 'Devon Park',
    username: 'devon_park',
    bio: 'Indie maker crafting ambient focus tools without streaks or gamification.',
    roles: ['Founder / Independent Maker', 'Product Manager'],
    interests: ['Productivity'],
    industries: ['Productivity & Workplace'],
    technologies: ['JavaScript / React'],
  },
]

export const SAMPLE_PRODUCTS = [
  {
    slug: 'weeknote',
    name: 'Weeknote',
    tagline: 'Turn scattered tasks into a realistic weekly plan.',
    description:
      'Weeknote helps students and independent builders plan their week, keep track of unfinished tasks, and see what needs attention next.',
    stage: 'Working prototype',
    creatorEmail: 'elena.rostova@buildboard.dev',
    categories: ['Productivity', 'Learning'],
    audience: 'Students and independent builders',
    feedbackRequest: 'Try planning one week. Tell us where the process feels clear or confusing.',
    productUrl: 'https://weeknote.vercel.app',
    githubUrl: 'https://github.com/example/weeknote',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=1200&q=80',
    ],
    targetRoles: ['Student / Learner', 'Founder / Independent Maker'],
    targetIndustries: ['Education & EdTech', 'Productivity & Workplace'],
    targetTechnologies: ['JavaScript / React'],
    whatToTry: [
      'Add a few tasks to your week',
      'Move an unfinished task to another day',
      'Tell us what you expected to happen',
    ],
  },
  {
    slug: 'token-sync',
    name: 'TokenSync',
    tagline: 'Bridge design tokens from Figma directly into CSS variables and Tailwind.',
    description:
      'A lightweight utility that converts design token exports from Figma into clean CSS variables and Tailwind v4 theme configs without manual copy-pasting.',
    stage: 'Working prototype',
    creatorEmail: 'marcus.chen@buildboard.dev',
    categories: ['Design', 'Developer Tools'],
    audience: 'Design system engineers and frontend developers',
    feedbackRequest: 'Test the token translation mapping. Tell us if color format conversions and typography token sizes felt intuitive.',
    productUrl: 'https://tokensync.dev',
    githubUrl: 'https://github.com/example/tokensync',
    imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    ],
    targetRoles: ['Designer / UI / UX', 'Software Engineer / Developer'],
    targetIndustries: ['Developer Software & Cloud', 'Creative & Media'],
    targetTechnologies: ['Design / UX', 'JavaScript / React'],
    whatToTry: [
      'Review the sample typography token export',
      'Check dark and light mode color variable definitions',
      'Share any missing design token properties you needed',
    ],
  },
  {
    slug: 'prompt-bench',
    name: 'PromptBench',
    tagline: 'Side-by-side evaluation harness for LLM structured output.',
    description:
      'Compare schema adherence, latency, and token efficiency across prompt variations simultaneously without writing testing boilerplate.',
    stage: 'Working prototype',
    creatorEmail: 'sarah.jenkins@buildboard.dev',
    categories: ['AI & Automation', 'Developer Tools'],
    audience: 'AI engineers and software builders integrating generative APIs',
    feedbackRequest: 'Run the bundled JSON schema comparison test. Tell us whether the visual field diff makes discrepancies easy to spot.',
    productUrl: 'https://promptbench.io',
    githubUrl: 'https://github.com/example/promptbench',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    ],
    targetRoles: ['Software Engineer / Developer', 'Data Analyst / Data Scientist'],
    targetIndustries: ['Developer Software & Cloud', 'Productivity & Workplace'],
    targetTechnologies: ['AI / machine learning', 'Python'],
    whatToTry: [
      'Inspect the test JSON schema definition',
      'Compare response outputs across two simulated endpoints',
      'Check whether validation errors are formatted clearly',
    ],
  },
  {
    slug: 'query-lens',
    name: 'QueryLens',
    tagline: 'Visual explain plans and query performance inspector for SQLite.',
    description:
      'Inspect query execution graphs, identify missing indexes, and observe query cost breakdowns for local SQLite files.',
    stage: 'Working prototype',
    creatorEmail: 'kavita.rao@buildboard.dev',
    categories: ['Developer Tools', 'Learning'],
    audience: 'Backend engineers and students learning SQL optimization',
    feedbackRequest: 'Examine an unindexed JOIN query plan. Share whether the highlighted node explanations helped you understand the bottleneck.',
    productUrl: 'https://querylens.dev',
    githubUrl: 'https://github.com/example/querylens',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    ],
    targetRoles: ['Software Engineer / Developer', 'Student / Learner'],
    targetIndustries: ['Developer Software & Cloud', 'Education & EdTech'],
    targetTechnologies: ['Data / analytics', 'Cloud / DevOps'],
    whatToTry: [
      'Open the sample query explain tree',
      'Compare execution times between indexed and unindexed table scans',
      'Provide feedback on the node detail inspector',
    ],
  },
  {
    slug: 'focus-orbit',
    name: 'FocusOrbit',
    tagline: 'Ambient work intervals without distraction loops or streaks.',
    description:
      'A calm, distraction-free timer that synchronizes gentle interval cues across open tabs, keeping builders in flow without gamification pressure.',
    stage: 'Working prototype',
    creatorEmail: 'devon.park@buildboard.dev',
    categories: ['Productivity'],
    audience: 'Remote developers, writers, and independent creators',
    feedbackRequest: 'Complete one focus interval. Tell us if the tab notification sound and favicon state indicator felt natural.',
    productUrl: 'https://focusorbit.app',
    githubUrl: 'https://github.com/example/focusorbit',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80',
    ],
    targetRoles: ['Founder / Independent Maker', 'Product Manager'],
    targetIndustries: ['Productivity & Workplace', 'Healthcare & Wellbeing'],
    targetTechnologies: ['JavaScript / React'],
    whatToTry: [
      'Start a 25-minute test session',
      'Observe browser tab title updates when switching windows',
      'Check the chime volume and audio feedback options',
    ],
  },
]

export const SAMPLE_PROBLEMS = [
  {
    slug: 'figma-to-tailwind-variables',
    title: 'Design tokens constantly drift between Figma Variables and Tailwind v4 themes',
    statement:
      'Every time our UI designer updates a spacing scale or brand color in Figma, someone has to manually translate the JSON or CSS variables into our Tailwind CSS configuration. Within two sprints, naming conventions diverge and devs are hardcoding hex values again.',
    workarounds:
      'Exporting tokens via community Figma plugins, running a custom node script that breaks on nested variable modes, and manual code reviews.',
    targetAudience: 'Design system engineers, frontend developers, and product designers',
    proposedConcept:
      'A GitHub Action + lightweight CLI that automatically listens to Figma webhooks, normalizes variable modes (light/dark/high-contrast), and opens an automated PR directly updating @theme in Tailwind CSS v4.',
    category: 'Design',
    stage: 'Validating Need',
    creatorEmail: 'elena.rostova@buildboard.dev',
    targetRoles: ['Designer / UI / UX', 'Software Engineer / Developer'],
    targetIndustries: ['Developer Software & Cloud', 'Creative & Media'],
  },
  {
    slug: 'cross-browser-extension-manifest-v3',
    title: 'Debugging service-worker lifecycle terminations in Chrome & Safari Manifest V3 extensions',
    statement:
      'In Manifest V3, background service workers terminate every 30 seconds of inactivity. Simulating long-lived state, storage sync, or SSE connections during local development causes mysterious silent drops that are impossible to inspect in standard devtools without attaching separate debuggers.',
    workarounds:
      'Keeping dummy ports open to artificially prolong worker lifetime, scattering console logs everywhere, and restarting extension processes repeatedly.',
    targetAudience: 'Browser extension builders and indie web hackers',
    proposedConcept:
      'A lightweight debugging wrapper library (mv3-telemetry) that visualizes worker state changes, alerts when a worker is about to terminate with pending queue items, and provides a mock heartbeat for unit test environments.',
    category: 'Developer Tools',
    stage: 'Prototyping',
    creatorEmail: 'kavita.rao@buildboard.dev',
    targetRoles: ['Software Engineer / Developer', 'Founder / Independent Maker'],
    targetIndustries: ['Developer Software & Cloud', 'Productivity & Workplace'],
  },
  {
    slug: 'student-internship-portfolio-feedback',
    title: 'Computer science students build side projects but get zero code quality feedback from senior engineers',
    statement:
      'Students spend months following tutorials and building portfolio projects for internships. But without senior code reviews, they repeatedly commit anti-patterns, over-engineered state, or poor accessibility that gets them rejected by recruiters without any explanation.',
    workarounds:
      'Begging for code reviews on Reddit /r/learnprogramming or Discord servers where 90% of requests are ignored.',
    targetAudience: 'Undergraduates, boot camp students, and junior self-taught developers',
    proposedConcept:
      'A structured code teardown exchange: junior builders request a 15-minute asynchronous architecture audit on a specific 200-line module, and senior mentors earn verified community recognition points for actionable critique.',
    category: 'Learning',
    stage: 'Validating Need',
    creatorEmail: 'devon.park@buildboard.dev',
    targetRoles: ['Student / Learner', 'Software Engineer / Developer'],
    targetIndustries: ['Education & EdTech', 'Community & Social'],
  },
  {
    slug: 'unstructured-user-interview-synthesis',
    title: 'Synthesizing 40-minute user feedback audio into concrete feature decisions takes half a day',
    statement:
      'Early-stage founders do 5 to 10 customer discovery calls a week. Traditional transcription tools give you a massive wall of text, but categorizing who said what, which pain was urgent, and which feature was just a casual request takes 4+ hours of manual tagging in Notion or spreadsheets.',
    workarounds:
      'Manually jotting bullet points while on the call (distracting), or pasting transcripts into ChatGPT with prompt chains that lose speaker nuances.',
    targetAudience: 'Solo founders, early product managers, and indie hackers',
    proposedConcept:
      'A focused interview organizer that ingests raw transcript text, extracts direct user quotes tagged by pain urgency (Blocker vs Nice-to-have), and outputs a structured matrix mapped to your product roadmap.',
    category: 'Productivity',
    stage: 'Concept in Progress',
    creatorEmail: 'sarah.jenkins@buildboard.dev',
    targetRoles: ['Founder / Independent Maker', 'Product Manager'],
    targetIndustries: ['Productivity & Workplace', 'Developer Software & Cloud'],
  },
]

export async function seedDatabaseIfEmpty(db) {
  try {
    const [countRows] = await db.execute('SELECT COUNT(*) AS total FROM products')
    const total = Number(countRows[0]?.total || 0)
    if (total > 0) {
      return { seeded: false, message: `Database already has ${total} product(s). No seeding needed.` }
    }

    console.log('[Seed] Database has zero products. Populating sample prototypes and community problems...')

    const userMap = new Map()

    // 1. Seed Makers in users & user_profiles
    for (const builder of SAMPLE_BUILDERS) {
      const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [builder.email])
      let userId = existingUser[0]?.id
      if (!userId) {
        const dummyUid = `seed_builder_${builder.username}`
        const [insertRes] = await db.execute(
          `INSERT INTO users (firebase_uid, email, email_verified) VALUES (?, ?, TRUE)
           ON DUPLICATE KEY UPDATE email_verified = TRUE`,
          [dummyUid, builder.email],
        )
        userId = insertRes.insertId
      }
      userMap.set(builder.email, userId)

      // Ensure profile exists
      const [existingProfile] = await db.execute('SELECT user_id FROM user_profiles WHERE user_id = ? LIMIT 1', [userId])
      if (existingProfile.length === 0) {
        const profileData = {
          displayName: builder.displayName,
          username: builder.username,
          handle: builder.username,
          bio: builder.bio,
          roles: builder.roles,
          interests: builder.interests,
          industries: builder.industries,
          technologies: builder.technologies,
          testingDevices: ['Chrome / Web Browser', 'Mac / Desktop'],
          feedbackFocus: ['UI & Visual Polish', 'Usability & Onboarding'],
          participation: ['builder', 'tester'],
          experienceLevel: 'intermediate',
          availability: '3-5 hours / week',
          location: 'San Francisco, CA',
          website: '',
          github: '',
          twitter: '',
          linkedin: '',
          defaultLandingView: 'explore',
          reminderCadence: 'standard',
          notifyBuilderReplies: true,
          notifyHelpfulNotes: true,
          notifyWeeklyDigest: true,
          soundEffects: true,
          cardDensity: 'comfortable',
        }
        await db.execute('INSERT INTO user_profiles (user_id, profile_data) VALUES (?, ?)', [
          userId,
          JSON.stringify(profileData),
        ])
      }
    }

    // 2. Seed Products
    for (const prod of SAMPLE_PRODUCTS) {
      const creatorId = userMap.get(prod.creatorEmail) || Array.from(userMap.values())[0]
      const [prodRes] = await db.execute(
        `INSERT INTO products (
           slug, creator_id, name, tagline, description, stage,
           audience, feedback_request, product_url, github_url,
           image_url, gallery, is_sample, enrollment_limit
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 50)`,
        [
          prod.slug,
          creatorId,
          prod.name,
          prod.tagline,
          prod.description,
          prod.stage,
          prod.audience,
          prod.feedbackRequest,
          prod.productUrl,
          prod.githubUrl,
          prod.imageUrl,
          JSON.stringify(prod.gallery || []),
        ],
      )

      const productId = prodRes.insertId

      // Categories
      for (const cat of prod.categories) {
        await db.execute(
          'INSERT INTO product_target_criteria (product_id, criteria_type, criteria_value) VALUES (?, ?, ?)',
          [productId, 'category', cat],
        )
      }
      // Target Roles
      for (const role of prod.targetRoles) {
        await db.execute(
          'INSERT INTO product_target_criteria (product_id, criteria_type, criteria_value) VALUES (?, ?, ?)',
          [productId, 'role', role],
        )
      }
      // Target Industries
      for (const ind of prod.targetIndustries) {
        await db.execute(
          'INSERT INTO product_target_criteria (product_id, criteria_type, criteria_value) VALUES (?, ?, ?)',
          [productId, 'industry', ind],
        )
      }
      // Target Technologies
      for (const tech of prod.targetTechnologies) {
        await db.execute(
          'INSERT INTO product_target_criteria (product_id, criteria_type, criteria_value) VALUES (?, ?, ?)',
          [productId, 'technology', tech],
        )
      }
      // What to try steps
      for (let i = 0; i < prod.whatToTry.length; i++) {
        await db.execute(
          'INSERT INTO product_test_steps (product_id, step_order, instruction) VALUES (?, ?, ?)',
          [productId, i + 1, prod.whatToTry[i]],
        )
      }
    }

    // 3. Seed Problems
    for (const prob of SAMPLE_PROBLEMS) {
      const creatorId = userMap.get(prob.creatorEmail) || Array.from(userMap.values())[0]
      const [probRes] = await db.execute(
        `INSERT INTO problems (
           slug, creator_id, title, statement, workarounds,
           target_audience, proposed_concept, category, stage
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prob.slug,
          creatorId,
          prob.title,
          prob.statement,
          prob.workarounds,
          prob.targetAudience,
          prob.proposedConcept,
          prob.category,
          prob.stage,
        ],
      )

      const problemId = probRes.insertId

      // Target criteria
      for (const role of prob.targetRoles) {
        await db.execute(
          'INSERT INTO problem_target_criteria (problem_id, criteria_type, criteria_value) VALUES (?, ?, ?)',
          [problemId, 'role', role],
        )
      }
      for (const ind of prob.targetIndustries) {
        await db.execute(
          'INSERT INTO problem_target_criteria (problem_id, criteria_type, criteria_value) VALUES (?, ?, ?)',
          [problemId, 'industry', ind],
        )
      }
    }

    console.log('[Seed] Successfully seeded 5 sample products and 4 community problems into database!')
    return { seeded: true, productsCount: SAMPLE_PRODUCTS.length, problemsCount: SAMPLE_PROBLEMS.length }
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err)
    throw err
  }
}
