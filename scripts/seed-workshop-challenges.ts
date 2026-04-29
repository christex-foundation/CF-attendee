import { db } from "../src/lib/db";
import { challenges, quizQuestions } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ChallengeType } from "../src/types";

const ANCHOR_SESSION = Number(process.env.SEED_ANCHOR_SESSION ?? "1");

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
    title: "Workflow Reflexes",
    description:
      "Ten questions on the team Git flow you just walked through. You need all ten correct to pass — no partial credit. Everything here is straight from the deck.",
    type: "quiz",
    pointsReward: 50,
    badgeEmoji: "🌿",
    badgeName: "Branch Boss",
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "You're starting work on the homepage. What's the very first command?",
        options: [
          "git push origin main",
          "git pull origin main",
          'git commit -am "start"',
          "git checkout main",
        ],
        correctIndex: 1,
      },
      {
        questionText: "Which commit message would actually pass review?",
        options: [
          "update",
          "fix stuff",
          "Add signup button to homepage",
          "changes",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "When does your branch first appear on GitHub for teammates to see?",
        options: [
          "After git commit",
          "After git add",
          "After git push",
          "After opening a pull request",
        ],
        correctIndex: 2,
      },
      {
        questionText: "Why do teams use feature branches?",
        options: [
          "They're faster than working on main",
          "They let many people work without breaking the shared branch",
          "GitHub requires it",
          "They're easier to delete later",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Where do teammates leave feedback BEFORE your code merges into main?",
        options: [
          "In the commit messages",
          "In a chat channel",
          "On the pull request",
          "Inside README.md",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "Which file do teammates open first to understand what your project does?",
        options: ["index.html", "README.md", "package.json", ".gitignore"],
        correctIndex: 1,
      },
      {
        questionText:
          'In the team mental model from the deck, what comes IMMEDIATELY after "push to GitHub"?',
        options: [
          "Make a small change",
          "Commit clearly",
          "Open a pull request",
          "Review and merge",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "You just created a new file. Which command stages it for the next commit?",
        options: [
          "git stage <file>",
          "git add <file>",
          "git commit <file>",
          "git push <file>",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "According to the deck's rule, your commit message should...",
        options: [
          "Reference a ticket number",
          "Be exactly 50 characters",
          "Explain what changed without opening the code",
          "Include the file names you touched",
        ],
        correctIndex: 2,
      },
      {
        questionText: 'What does it mean to "merge" a pull request?',
        options: [
          "It deletes your feature branch",
          "It combines your branch's changes into the target branch (e.g. main)",
          "It runs the test suite",
          "It creates a backup of main",
        ],
        correctIndex: 1,
      },
    ],
  },

  {
    title: "Ship Your First Branch",
    description: [
      "Run the real workflow end-to-end:",
      "",
      "1. Create or clone your repo.",
      "2. git checkout -b feature-desc",
      "3. Create README.md with: project name, one-line problem, who it's for, three must-have features.",
      "4. Commit with a clear message (no 'update' or 'fix stuff').",
      "5. Push the branch.",
      "",
      "Paste the GitHub URL of your branch (or PR) below.",
    ].join("\n"),
    type: "task",
    pointsReward: 50,
    badgeEmoji: "🚀",
    badgeName: "First Push",
    deadline: SESSION_DEADLINE,
  },

  {
    title: "What Are You Building?",
    description:
      "Three quick questions so we can tailor the next session. No wrong answers.",
    type: "poll",
    pointsReward: 0,
    questions: [
      {
        questionText: "What's your first project most likely to be?",
        options: [
          "Website (portfolio, blog, landing page)",
          "Web app (dashboard, chat, e-commerce)",
          "Mobile app",
          "Not sure yet",
        ],
        correctIndex: 0,
      },
      {
        questionText: "Where are you on the command line?",
        options: [
          "First time",
          "I copy commands without really getting them",
          "I get most of it",
          "Comfortable",
        ],
        correctIndex: 0,
      },
      {
        questionText: "What's blocking you the most right now?",
        options: [
          "Picking a stack",
          "Defining the product clearly",
          "Working with a team in Git",
          "Deploying anything to the internet",
        ],
        correctIndex: 0,
      },
    ],
  },

  {
    title: "Stretch Break Pulse",
    description:
      "When the window opens, tap to confirm you're still here. You get 90 seconds.",
    type: "checkin",
    pointsReward: 5,
    checkinWindowSeconds: 90,
  },

  {
    title: "Trust Your Git",
    description: [
      "Pick how many points you'd bet you actually know git. Get every question right and gain that much. Get one wrong and lose it.",
      "",
      "Most of these aren't on the slides — read the docs.",
    ].join("\n"),
    type: "wager",
    pointsReward: 0,
    badgeEmoji: "🎯",
    badgeName: "Sure Hands",
    wagerMin: 5,
    wagerMax: 25,
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "Which command creates a new branch AND switches to it in one step?",
        options: [
          "git branch new",
          "git switch new",
          "git checkout -b new",
          "git create new",
        ],
        correctIndex: 2,
      },
      {
        questionText: "Under the hood, what does `git pull origin main` do?",
        options: [
          "git fetch + git merge origin/main",
          "Pushes local then reverts on failure",
          "Clones the repo fresh into a new folder",
          "Resets your branch to match origin/main",
        ],
        correctIndex: 0,
      },
      {
        questionText:
          "You just committed but want to UNDO the commit while keeping the changes staged. Which command?",
        options: [
          "git reset --hard HEAD~1",
          "git reset --soft HEAD~1",
          "git revert HEAD",
          "git checkout HEAD~1",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "You want to stash your work, INCLUDING untracked files. Which flag?",
        options: [
          "git stash --all",
          "git stash --keep-index",
          "git stash -u (--include-untracked)",
          "git stash --new",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "A great commit landed on `bugfix/nav` and you want JUST that one commit on your branch. Which command?",
        options: [
          "git merge bugfix/nav",
          "git rebase bugfix/nav",
          "git cherry-pick <commit-hash>",
          "git pull bugfix/nav",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "You're on branch `feat-old` and want to rename it to `feat-new`. Which command?",
        options: [
          "git branch rename feat-new",
          "git branch -m feat-new",
          "git checkout -rename feat-new",
          "git mv feat-old feat-new",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "How do you list local branches that have ALREADY been merged into main?",
        options: [
          "git branch --merged main",
          "git log --merged main",
          "git status --merged",
          "git diff --merged main",
        ],
        correctIndex: 0,
      },
      {
        questionText:
          "Which command shows the commit history as a graph across ALL branches?",
        options: [
          "git log --branches",
          "git log --all --graph --oneline",
          "git history --tree",
          "git show --all",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which command shows you who last changed each line of a specific file?",
        options: [
          "git log --who <file>",
          "git diff --author <file>",
          "git blame <file>",
          "git history <file>",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "You want to permanently throw away ALL uncommitted changes to tracked files. Which command?",
        options: [
          "git clean -fd",
          "git reset --hard HEAD",
          "git revert HEAD",
          "git stash drop",
        ],
        correctIndex: 1,
      },
    ],
  },

  {
    title: "First Real Pull Request",
    description: [
      "Stretch Part 1 into the real world: open a pull request against ANY real public open-source repo. Typo fixes, doc tweaks, README clarifications all count.",
      "",
      "Approval bar:",
      "- The PR exists on a public repo you don't own",
      "- The diff is non-empty and meaningful (no whitespace-only changes)",
      "- Commit message follows the rule from the deck",
      "",
      "Paste your PR URL below. First admin-approved submission wins.",
    ].join("\n"),
    type: "bounty",
    pointsReward: 60,
    badgeEmoji: "🥇",
    badgeName: "Open Source Debut",
    deadline: END_OF_DAY,
  },

  {
    title: "Defend Your Stack",
    description: [
      "Challenge a classmate. The prompt is the same for both of you:",
      "",
      "\"You're building a real-time chat app for 50 college students. Pick the stack you'd actually ship — frontend, backend, database, hosting — and defend it in under 150 words. Cite at least one tradeoff you accepted.\"",
      "",
      "Admin picks the more convincing argument. Winner takes the wager.",
    ].join("\n"),
    type: "duel",
    pointsReward: 0,
    badgeEmoji: "⚔️",
    badgeName: "Convincing Engineer",
    wagerMin: 10,
    wagerMax: 30,
    deadline: SESSION_DEADLINE,
  },
];

async function seed() {
  console.log(
    `Seeding ${SEED.length} workshop challenges (anchor session ${ANCHOR_SESSION})…\n`
  );

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
        anchorSession: ANCHOR_SESSION,
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
      `  [ok]   "${c.title}" (${c.type}) → id ${row.id}${
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
