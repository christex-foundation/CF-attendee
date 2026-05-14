import { db } from "../src/lib/db";
import { challenges, quizQuestions } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ChallengeType } from "../src/types";

const SESSION_DEADLINE = new Date(Date.now() + 1000 * 60 * 60 * 4); // +4h
const END_OF_DAY = (() => {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  return d;
})();

interface QuestionInput {
  questionText: string;
  options: string[];
  correctIndex: number;
}

interface ChallengeInput {
  title: string;
  description: string;
  type: ChallengeType;
  anchorSession: number;
  pointsReward: number;
  badgeEmoji?: string;
  badgeName?: string;
  deadline?: Date | null;
  speedSlots?: number;
  checkinWindowSeconds?: number;
  wagerMin?: number;
  wagerMax?: number;
  decayEnabled?: boolean;
  decayStartPoints?: number;
  decayPointsPerInterval?: number;
  decayIntervalSeconds?: number;
  questions?: QuestionInput[];
}

const SEED: ChallengeInput[] = [
  {
    title: "Stack Reflexes",
    description:
      "Ten questions on the Tech Stack 101 deck — frontend and backend frameworks, when to pick which, the starter commands. All ten correct to pass; no partial credit.",
    type: "quiz",
    anchorSession: 11,
    pointsReward: 50,
    badgeEmoji: "🧱",
    badgeName: "Stack Picker",
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "Restaurant analogy from the deck: the frontend is the ___ and the backend is the ___.",
        options: [
          "kitchen / dining room",
          "dining room / kitchen",
          "menu / receipt",
          "chef / waiter",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which framework does the deck describe as 'React with batteries included' — routing, server rendering and APIs all wired up for you?",
        options: ["Vite", "Remix", "Next.js", "Angular"],
        correctIndex: 2,
      },
      {
        questionText:
          "Which UI framework compiles your code at build time so you ship smaller files?",
        options: ["React", "Vue", "Svelte", "Angular"],
        correctIndex: 2,
      },
      {
        questionText:
          "You want a quick API for a school project with minimal hand-holding. The deck recommends:",
        options: [
          "NestJS",
          "Express or Hono",
          "FastAPI",
          "Next.js API routes",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which backend framework borrows ideas from Angular — modules, dependency injection, decorators?",
        options: ["Express", "Fastify", "NestJS", "Hono"],
        correctIndex: 2,
      },
      {
        questionText:
          "Which Python framework does the deck describe as 'big in AI and machine learning'?",
        options: ["Django", "Flask", "FastAPI", "Tornado"],
        correctIndex: 2,
      },
      {
        questionText:
          "Which framework runs on Node, Bun, Deno AND Cloudflare Workers?",
        options: ["Express", "Fastify", "NestJS", "Hono"],
        correctIndex: 3,
      },
      {
        questionText:
          "The deck's three questions for picking a stack are: what am I building, who will use it, and ___?",
        options: [
          "what does my team already know?",
          "what's cheapest to host?",
          "what's the newest framework?",
          "what's the trendiest on Twitter?",
        ],
        correctIndex: 0,
      },
      {
        questionText:
          "You're building a public-facing website that needs Google to find it. Best pick from the deck:",
        options: ["React (Vite)", "Svelte", "Next.js", "Angular"],
        correctIndex: 2,
      },
      {
        questionText:
          "The deck's starter command for a new Next.js app is:",
        options: [
          "npm install next",
          "npx create-next-app@latest",
          "npm create next@latest",
          "next init",
        ],
        correctIndex: 1,
      },
    ],
  },

  {
    title: "Package Pantry",
    description:
      "Ten questions on the Package Managers 101 deck — node vs npm, the four landmarks, the seven commands, npx, and the errors you'll actually hit. All ten correct to pass.",
    type: "quiz",
    anchorSession: 11,
    pointsReward: 50,
    badgeEmoji: "🛒",
    badgeName: "Pantry Stocker",
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "Memory hook from the deck: node ___ code, npm ___ code.",
        options: [
          "writes / runs",
          "runs / fetches",
          "fetches / runs",
          "compiles / installs",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "After `npm install chalk`, three things appear in your project. Which is NOT one of them?",
        options: [
          "A new entry under `dependencies` in package.json",
          "A `node_modules/` folder",
          "A `package-lock.json` file",
          "A `dist/` folder",
        ],
        correctIndex: 3,
      },
      {
        questionText:
          "Your code crashes with `Cannot find module 'chalk'`. Per the deck, the fix is:",
        options: [
          "Restart the terminal",
          "Reinstall Node from nodejs.org",
          "Run `npm install`",
          "Add chalk to package.json by hand",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "The deck's 'universal first-aid kit' when something feels haunted is:",
        options: [
          "`npm cache clean --force`",
          "`npm doctor`",
          "Delete `node_modules` and `package-lock.json`, then `npm install`",
          "Reinstall Node from scratch",
        ],
        correctIndex: 2,
      },
      {
        questionText: "`npm run start` does what?",
        options: [
          "Starts the npm registry locally",
          "Runs the `start` command saved in package.json scripts",
          "Runs the first .js file it finds",
          "Spins up a dev server on port 3000",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "The deck calls `npx` 'rent, don't buy'. The point is:",
        options: [
          "It's free for the first run",
          "It installs into a temp folder you can delete later",
          "It runs a package once without adding it to your project",
          "It's faster than npm install",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "Which file is the 'exact receipt' — the precise versions installed?",
        options: [
          "package.json",
          "package-lock.json",
          "node_modules/.package-lock.json",
          "npm-shrinkwrap.json",
        ],
        correctIndex: 1,
      },
      {
        questionText: "The deck warns you NOT to:",
        options: [
          "Use `npm` instead of `node` to run a file",
          "Mix npm, yarn and pnpm in the same project",
          "Commit `package.json`",
          "Install more than five packages",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "You ran `npm uninstall figlet` but your code still has `import figlet from 'figlet'`. What happens when you run it?",
        options: [
          "The import returns undefined silently",
          "node re-downloads figlet on demand",
          "The code crashes at the import",
          "The import resolves to a stub",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "Which command starts a new project with default package.json answers?",
        options: ["npm create", "npm new", "npm init -y", "npm start"],
        correctIndex: 2,
      },
    ],
  },

  {
    title: "Bet on Your Setup",
    description: [
      "Wager what you think you know about npm and friends. All correct → gain your wager. One wrong → lose it.",
      "",
      "Most of these aren't on the slides. Read the docs.",
    ].join("\n"),
    type: "wager",
    anchorSession: 12,
    pointsReward: 0,
    badgeEmoji: "🎲",
    badgeName: "House Edge",
    wagerMin: 5,
    wagerMax: 25,
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "Your package.json says `\"chalk\": \"^1.2.3\"`. Which version range does npm allow on install?",
        options: [
          "Only 1.2.3 exactly",
          ">=1.2.3 <2.0.0",
          ">=1.2.3 <1.3.0",
          ">=1.0.0 <2.0.0",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "And `\"chalk\": \"~1.2.3\"`? Which range is allowed?",
        options: [
          "Only 1.2.3 exactly",
          ">=1.2.3 <2.0.0",
          ">=1.2.3 <1.3.0",
          ">=1.0.0 <2.0.0",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "Which flag installs a package only as a development dependency?",
        options: [
          "--dev",
          "--save-dev (or -D)",
          "--only-dev",
          "--devOnly",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which command prints the dependency tree of what's currently installed?",
        options: ["npm tree", "npm ls", "npm deps", "npm show --tree"],
        correctIndex: 1,
      },
      {
        questionText:
          "You want a clean install that fails if package-lock.json is out of sync with package.json. Use:",
        options: [
          "npm install",
          "npm install --frozen",
          "npm ci",
          "npm install --exact",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "`npm install -g <pkg>` on macOS/Linux installs into:",
        options: [
          "./node_modules/.bin",
          "The system-wide global prefix (e.g. /usr/local/lib/node_modules)",
          "~/.npm/cache",
          "~/.node/global",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "By default, `npm publish` publishes the package as:",
        options: [
          "private",
          "public",
          "draft until you confirm",
          "It prompts you each time",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "pnpm saves disk space mostly because it:",
        options: [
          "Compresses node_modules with gzip",
          "Uses a content-addressable global store with hard-links / symlinks",
          "Deduplicates by hashing every import",
          "Only installs the files your code actually imports",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "To pass extra args through `npm run` to the underlying command (e.g. `--port=3001` to your dev script), the correct syntax is:",
        options: [
          "npm run dev --port=3001",
          "npm run dev -- --port=3001",
          "npm run dev:3001",
          "npm run \"dev --port=3001\"",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "`npm outdated` prints three version columns: Current, Wanted, Latest. 'Wanted' means:",
        options: [
          "The latest version published to the registry",
          "The latest version that satisfies the range in your package.json",
          "The version your teammates installed",
          "The version with the most weekly downloads",
        ],
        correctIndex: 1,
      },
    ],
  },

  {
    title: "Ship the PoC",
    description: [
      "You've seen the stack. You've used AI tools. Now ship something tiny that actually runs.",
      "",
      "THE STACK (non-negotiable):",
      "- Next.js (App Router)",
      "- Postgres (Neon, Supabase, or local — your call)",
      "- Tailwind CSS",
      "",
      "PICK ONE IDEA:",
      "1. Pomodoro timer with a session log — save every focus session to Postgres, list the last 10.",
      "2. Class poll / standup-minutes app — one question, shareable link, votes/answers persisted.",
      "3. Habit tracker with streaks — CRUD habits + daily check-ins + visualise the streak.",
      "4. AI tag/hashtag generator — paste text, call an LLM API, return 5 hashtags, save history.",
      "5. Event Manager — CRUD events (date, title, notes); list view; one detail page.",
      "6. Cohort Blog — one post type (author + body + timestamp); list and detail pages.",
      "",
      "THE RULES:",
      "- Use any AI tool to help (Claude, ChatGPT, Cursor, Copilot, Cody — your pick).",
      "- Create a NEW PUBLIC GitHub repo for this. Don't bolt it onto an old one.",
      "- At least 3 meaningful commits. No `wip` or `update` messages — same rule as session 1.",
      "- README must include: what it does, the stack, how to run it locally, and ONE thing the AI got wrong that you had to fix.",
      "- `npm install && npm run dev` must work on a fresh clone. At least one feature has to actually do something — no static-only submissions.",
      "",
      "APPROVAL BAR:",
      "- Repo is public; commit history reads sensibly.",
      "- README hits all four bullets above.",
      "- Admin clones it and the core feature works.",
      "",
      "Paste your GitHub repo URL below.",
    ].join("\n"),
    type: "bounty",
    anchorSession: 12,
    pointsReward: 90,
    badgeEmoji: "🤖",
    badgeName: "Vibe Operator",
    deadline: END_OF_DAY,
  },

  {
    title: "AI Honesty Card",
    description: [
      "You just shipped a PoC with help from an AI tool. Write a short, honest reflection — three paragraphs, one per question.",
      "",
      "1. What did the AI get RIGHT that saved you time? Be specific. \"It wrote my form validation in 30 seconds\" beats \"it was helpful\".",
      "",
      "2. What did the AI get WRONG that you had to fix? Pick ONE concrete case — a hallucinated function, a wrong import, a deprecated API, a security issue — and describe how you fixed it.",
      "",
      "3. What would you do DIFFERENTLY next time you use AI for a project? A better prompt, an earlier doc read, a check you'd add to your workflow.",
      "",
      "Paste your three paragraphs below. Copy-paste from your PoC README does NOT count — this should be new writing.",
    ].join("\n"),
    type: "task",
    anchorSession: 13,
    pointsReward: 30,
    badgeEmoji: "🧭",
    badgeName: "Self-Aware Builder",
    deadline: END_OF_DAY,
  },
];

async function seed() {
  console.log(`Seeding ${SEED.length} AI-PoC workshop challenges…\n`);

  let created = 0;
  let skipped = 0;

  for (const c of SEED) {
    const existing = await db
      .select({ id: challenges.id })
      .from(challenges)
      .where(eq(challenges.title, c.title))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  [skip] "${c.title}" — already exists (id ${existing[0].id})`);
      skipped++;
      continue;
    }

    const [row] = await db
      .insert(challenges)
      .values({
        title: c.title,
        description: c.description,
        type: c.type,
        status: "active",
        pointsReward: c.pointsReward,
        badgeEmoji: c.badgeEmoji ?? null,
        badgeName: c.badgeName ?? null,
        anchorSession: c.anchorSession,
        speedSlots: c.type === "speedrun" ? c.speedSlots ?? null : null,
        checkinWindowSeconds:
          c.type === "checkin" ? c.checkinWindowSeconds ?? null : null,
        wagerMin:
          c.type === "wager" || c.type === "duel" ? c.wagerMin ?? null : null,
        wagerMax:
          c.type === "wager" || c.type === "duel" ? c.wagerMax ?? null : null,
        deadline: c.deadline ?? null,
        decayEnabled: c.decayEnabled ?? false,
        decayStartPoints: c.decayStartPoints ?? 40,
        decayPointsPerInterval: c.decayPointsPerInterval ?? 1,
        decayIntervalSeconds: c.decayIntervalSeconds ?? 600,
      })
      .returning({ id: challenges.id });

    if (c.questions && c.questions.length > 0) {
      await db.insert(quizQuestions).values(
        c.questions.map((q, i) => ({
          challengeId: row.id,
          questionText: q.questionText,
          options: JSON.stringify(q.options),
          correctIndex: c.type === "poll" ? -1 : q.correctIndex,
          orderIndex: i,
        }))
      );
    }

    console.log(
      `  [ok]   "${c.title}" (${c.type}, session ${c.anchorSession}) → id ${row.id}${
        c.questions ? ` + ${c.questions.length} q` : ""
      }`
    );
    created++;
  }

  console.log(`\nDone. ${created} created, ${skipped} skipped.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
