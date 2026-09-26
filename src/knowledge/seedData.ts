export const lowisaSeedKnowledge = [
  {
    title: 'What is LoWisa?',
    category: 'product',
    tags: ['lowisa', 'overview', 'ai tutor', 'ide'],
    sourceName: 'LoWisa homepage',
    sourceUrl: 'https://lowisa.dev/',
    content: `LoWisa describes itself as an IDE with a live AI tutor that teaches developers to understand and own the code they ship. The product combines project understanding, guided explanation, hands-on work, safe sandboxing, and ownership checks. The website says the tutor can talk with the learner, open files, run terminal commands, and help explain the system rather than merely generate code.`
  },
  {
    title: 'System Immersion',
    category: 'learning',
    tags: ['system immersion', 'architecture', 'data flow', 'dependencies'],
    sourceName: 'LoWisa System Immersion guide',
    sourceUrl: 'https://lowisa.dev/learn/system-immersion/',
    content: `System Immersion is a LoWisa path for understanding an entire codebase rather than a single file at a time. It starts with what the project does, maps how it is organised, identifies entry points, traces data flow, and explains how components connect. LoWisa says it builds a live dependency and data-flow map of a sandboxed project before narration. The ownership check asks learners to name entry points, trace a record end to end, explain what breaks first under load, and identify the line that decides permission.`
  },
  {
    title: 'LoWisa AI Coding Tutor',
    category: 'learning',
    tags: ['tutor', 'ai coding tutor', 'ownership', 'challenge', 'evidence'],
    sourceName: 'LoWisa AI coding tutor guide',
    sourceUrl: 'https://lowisa.dev/learn/ai-coding-tutor/',
    content: `The LoWisa tutor is designed to help a learner explain and own a real codebase. It can start with System Immersion, ownership areas, an audit of AI-generated code, the Applied Mathematics Lab, or project continuation. The learning flow emphasizes evidence, safe experimentation, explaining a system back in the learner's own words, predicting what a change will do, and testing claims with commands or other evidence.`
  },
  {
    title: 'Audit My AI Code',
    category: 'product',
    tags: ['audit', 'ai code', 'security', 'production', 'code review'],
    sourceName: 'LoWisa homepage',
    sourceUrl: 'https://lowisa.dev/',
    content: `LoWisa presents an AI-code audit workflow that examines a project for knowledge gaps and engineering risks, then turns findings into a learning plan. The site gives a database connection pooling example where opening a new connection per request can exhaust the database under production traffic, and says the finding becomes a safe sandbox challenge to implement the fix.`
  },
  {
    title: '25 Engineering Domains',
    category: 'engineering',
    tags: ['25 domains', 'testing', 'backend', 'frontend', 'infrastructure', 'security'],
    sourceName: 'LoWisa homepage',
    sourceUrl: 'https://lowisa.dev/',
    content: `LoWisa groups 25 engineering domains across categories including testing and debugging; foundations such as version control, project structure, environment and secrets, code quality and types; backend and data such as database schema, DB pooling, API routing, auth and authorization, and API docs; frontend and UX such as state management, routing, and styling systems; infrastructure such as server config, Docker and containers, CI/CD, deployment and hosting; operations such as logging, monitoring, background jobs, performance, and caching; and security and storage such as security hardening, file storage/uploads, and backup/recovery.`
  },
  {
    title: 'Applied Math Lab',
    category: 'learning',
    tags: ['math', 'reasoning', 'systems thinking', 'optimization', 'probability'],
    sourceName: 'LoWisa homepage',
    sourceUrl: 'https://lowisa.dev/',
    content: `The Applied Math Lab connects engineering work with reasoning skills. The public site highlights pattern recognition, probability, optimization, systems thinking, trade-offs, decision-making, and root-cause analysis. The point is to develop the thinking used to reason about real engineering decisions.`
  },
  {
    title: 'Safe Sandbox',
    category: 'product',
    tags: ['sandbox', 'experimentation', 'safety', 'existing projects'],
    sourceName: 'LoWisa AI coding tutor guide',
    sourceUrl: 'https://lowisa.dev/learn/ai-coding-tutor/',
    content: `LoWisa says experiments happen in a safe sandbox copy so learners can break things without damaging the original project. This supports direct experimentation and lets the tutor turn failures into concrete lessons.`
  },
  {
    title: 'Project Continuation',
    category: 'learning',
    tags: ['continue project', 'existing codebase', 'memory'],
    sourceName: 'LoWisa AI coding tutor guide',
    sourceUrl: 'https://lowisa.dev/learn/ai-coding-tutor/',
    content: `Project continuation is one of the paths LoWisa describes: returning to something half-built and picking the thread up without being re-taught what the learner already owns.`
  },
  {
    title: 'Learning Cohorts and Clock it',
    category: 'community',
    tags: ['cohort', 'learning cohort', 'clock it', 'community'],
    sourceName: 'LoWisa AI coding tutor guide',
    sourceUrl: 'https://lowisa.dev/learn/ai-coding-tutor/',
    content: `LoWisa describes learning cohorts where a creator plans lessons, sets daily work, and runs contests. It also describes Clock it as a shared feed where learners post discoveries about AI.`
  },
  {
    title: 'Official LoWisa Resources',
    category: 'resources',
    tags: ['docs', 'guides', 'support', 'pricing', 'roadmap'],
    sourceName: 'LoWisa website',
    sourceUrl: 'https://lowisa.dev/',
    content: `Official resources include the homepage, learning guides, System Immersion guide, AI coding tutor guide, About page, Roadmap, Changelog, Support, FAQ, Pricing, and download links. Use the official website as the authoritative source when product details change.`
  }
] as const;
