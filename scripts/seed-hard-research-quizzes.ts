import { db } from "../src/lib/db";
import { challenges, quizQuestions } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ChallengeType } from "../src/types";

const SESSION_DEADLINE = new Date(Date.now() + 1000 * 60 * 60 * 24); // +24h

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
  questions: QuestionInput[];
}

const HARD_QUIZ_INTRO =
  "Very hard. 10/10 to pass; one attempt; zero on failure. The slides aren't enough — open the docs, form a model, then check yourself. Naively prompting AI will get you a confident wrong answer at least three times.";

const SEED: ChallengeInput[] = [
  {
    title: "Git Internals Gauntlet",
    description: HARD_QUIZ_INTRO + " Topic: how git actually works under .git/.",
    type: "quiz",
    anchorSession: 14,
    pointsReward: 100,
    badgeEmoji: "🪬",
    badgeName: "Plumber",
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "You run `git checkout abc123` (a SHA), then `git checkout main`. What was different about HEAD between the two states?",
        options: [
          "HEAD was uninitialised in the first state and initialised in the second",
          "HEAD pointed directly at the commit abc123 (detached); on main it points at refs/heads/main",
          "HEAD always points to a commit, so the two states were identical",
          "HEAD pointed at refs/remotes/origin/abc123 in the first state",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which of these is NOT recorded in your LOCAL git reflog?",
        options: [
          "A commit you just made and then `git reset --hard`'d away",
          "A `git checkout` between branches",
          "A force-push from a teammate that rewrote remote main",
          "A `git rebase` you ran locally",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "You `git add big.txt`. You then `rm big.txt` on disk and run `git rm --cached big.txt`. Is the blob you originally added gone from .git/?",
        options: [
          "Yes — `rm` plus `git rm --cached` together delete the blob",
          "No — the blob still lives in .git/objects/ and survives until `git gc` prunes unreachable objects",
          "The blob is moved to .git/lost-found/",
          "The blob is replaced with a tombstone object that points to /dev/null",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "A single file appears under BOTH `Changes to be committed` and `Changes not staged for commit` in `git status`. How is that possible?",
        options: [
          "It can't — git would only list each file once",
          "You staged one version of the file, then edited the file again; the index holds the staged version, the working tree holds the newer one",
          "Two parallel branches each touch the file",
          "The file is actually a submodule",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Why was `git switch` introduced in git 2.23?",
        options: [
          "Because `git checkout` is being deprecated and removed",
          "Because `checkout` is overloaded (branch switching, file restore, HEAD detachment) — `switch` handles only the branch role and `restore` handles only the file role",
          "Because `switch` is significantly faster",
          "Because only `switch` is allowed to update HEAD in modern git",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "You're in detached HEAD at commit abc123, you make two new commits on top, then run `git switch main`. What's the safe assumption about those two commits?",
        options: [
          "They've already been merged into main automatically",
          "They live on a hidden branch named `detached`",
          "They are now unreachable from any branch and will be garbage-collected eventually unless you create a branch pointing at them first (e.g. `git branch save HEAD@{1}`)",
          "They are permanently and immediately gone",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "Which of these is NOT one of git's four object types?",
        options: ["blob", "tree", "commit", "branch"],
        correctIndex: 3,
      },
      {
        questionText:
          "You `cat .git/HEAD` while checked out on the main branch. What do you typically see?",
        options: [
          "The current commit SHA, in hex",
          "`ref: refs/heads/main`",
          "The literal word `main`",
          "A JSON object describing the current branch state",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "After `git fetch origin`, which local refs are updated?",
        options: [
          "Your local branches (e.g. refs/heads/main)",
          "Your remote-tracking branches (e.g. refs/remotes/origin/main)",
          "Both your local and remote-tracking branches, automatically",
          "Neither — fetch only downloads objects without moving any refs",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "What's the practical difference between an ANNOTATED tag and a LIGHTWEIGHT tag?",
        options: [
          "There isn't one — both behave identically in modern git",
          "Annotated tags are full objects in .git/objects with author, message and date; lightweight tags are just refs that point directly at a commit",
          "Lightweight tags are always cryptographically signed; annotated tags never are",
          "Annotated tags can only point at merge commits",
        ],
        correctIndex: 1,
      },
    ],
  },

  {
    title: "Reset, Revert, Restore: The Real Diff",
    description: HARD_QUIZ_INTRO + " Topic: the destructive and recovery commands students conflate.",
    type: "quiz",
    anchorSession: 14,
    pointsReward: 100,
    badgeEmoji: "↩️",
    badgeName: "Time Bender",
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "You're on a clean working tree at commit C (parent B). You run `git reset --soft B`. What does `git status` show?",
        options: [
          "Nothing — working tree and index are clean",
          "The diff between B and C is staged in the index",
          "The diff between B and C is unstaged in the working tree",
          "The files are deleted from disk",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Same starting point. You run `git reset --mixed B` (the default). `git status` now shows:",
        options: [
          "Nothing — clean",
          "The diff between B and C staged in the index",
          "The diff between B and C unstaged in the working tree",
          "The files deleted from disk and untracked",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "Same starting point. You run `git reset --hard B`. `git status` now shows:",
        options: [
          "The diff between B and C staged",
          "The diff between B and C unstaged",
          "Clean working tree — your edits are gone from disk",
          "Conflict markers in every file",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "Bad commit X is already on main, already pushed, and teammates have pulled. What's the correct way to undo it?",
        options: [
          "`git reset --hard X^` then force-push to main",
          "`git revert X` then push — it creates a NEW commit that undoes X without rewriting shared history",
          "`git checkout X^ -- .` and commit",
          "`git rebase -i` and drop X, then force-push",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "`git restore --staged <file>` is the modern replacement for which older command?",
        options: [
          "`git reset HEAD <file>`",
          "`git checkout -- <file>`",
          "`git rm --cached <file>`",
          "`git stash push <file>`",
        ],
        correctIndex: 0,
      },
      {
        questionText:
          "Are `git checkout -- <file>` and `git restore <file>` equivalent?",
        options: [
          "No — `restore` only writes to disk; `checkout --` only updates the index",
          "Yes — both replace the working-tree copy of `<file>` with the version in the index",
          "No — `checkout --` requires the file to be tracked, but `restore` works on untracked files too",
          "Yes, but only `restore` respects .gitignore",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "You ran `git reset --hard HEAD~3` 30 minutes ago. Can the three commits be recovered?",
        options: [
          "No — `--hard` is permanent and irreversible",
          "Yes — they're still reachable via `git reflog`; create a branch at the prior HEAD with `git branch save HEAD@{1}` (or the SHA from reflog)",
          "Only if you'd previously pushed them to a remote",
          "Only by re-cloning the repository from scratch",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "An UNTRACKED file `scratch.log` exists in your working tree. You run `git reset --hard HEAD`. What happens to `scratch.log`?",
        options: [
          "Deleted — `--hard` wipes the working tree",
          "Left untouched — reset only affects tracked content; use `git clean -fd` to remove untracked files",
          "Moved to .git/lost-found/",
          "Added to the index automatically",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "What does `git revert -m 1 <merge-sha>` do?",
        options: [
          "Reverts both parents of the merge in two separate commits",
          "Reverts the changes the merge introduced relative to parent 1 (the mainline)",
          "Re-creates the merge commit with swapped parents",
          "Deletes the merge commit from history entirely",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "What does `git reset --keep <commit>` do that's different from `--hard`?",
        options: [
          "Nothing — it's a synonym for `--hard`",
          "It aborts if any local changes would be lost; otherwise behaves like `--hard`",
          "It keeps the reflog clean by skipping the entry",
          "It only updates HEAD without touching the index or working tree",
        ],
        correctIndex: 1,
      },
    ],
  },

  {
    title: "npm Lifecycle & Lockfile Gotchas",
    description: HARD_QUIZ_INTRO + " Topic: npm beyond the seven commands from the deck.",
    type: "quiz",
    anchorSession: 14,
    pointsReward: 100,
    badgeEmoji: "🔒",
    badgeName: "Lockmith",
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "On the same repo, when can `npm ci` FAIL while `npm install` SUCCEEDS?",
        options: [
          "`npm ci` never fails — they're aliases of each other",
          "When package-lock.json is missing or out of sync with package.json (npm ci requires them to match exactly)",
          "Only when `node_modules` already exists",
          "Only on Windows due to path-length limits",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Your library declares `react` in `peerDependencies`. What does that mean for someone consuming your library?",
        options: [
          "npm installs react inside your library's own node_modules folder",
          "The consuming app must provide a compatible react; npm only warns or errors if it's missing or mismatched — it does NOT auto-install it into your library",
          "The consumer can't use react directly in their own code",
          "React gets installed twice — once for the library and once for the app",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "A package listed in `optionalDependencies` fails to install (post-install script errors out). What happens to the overall `npm install`?",
        options: [
          "It aborts the whole install with a non-zero exit code",
          "npm logs the failure and continues — your project finishes installing successfully without that dependency",
          "npm retries the package indefinitely",
          "npm transparently switches to a fallback registry",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "When does the `prepare` lifecycle script run?",
        options: [
          "Only immediately before `npm publish`",
          "On `npm install` with no args (local-dev hook) AND before `npm publish` AND before `npm pack`",
          "Every time any npm script is invoked",
          "Only after `postinstall` completes",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Your package.json declares `\"engines\": { \"node\": \">=20\" }`. A user installs your package on Node 18 with default npm settings. What happens?",
        options: [
          "The install aborts with an error",
          "npm prints a warning about the engine mismatch and continues with the install",
          "npm automatically downloads Node 20 and re-runs the install",
          "The package installs but cannot be required at runtime",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "What does the `--legacy-peer-deps` flag actually change?",
        options: [
          "It uses npm v3-style peer-dependency behaviour: peer-dep conflicts are silently ignored instead of erroring",
          "It downgrades all your direct dependencies to their previous major version",
          "It deletes package-lock.json before installing",
          "It switches the registry to a legacy mirror at legacy.npmjs.com",
        ],
        correctIndex: 0,
      },
      {
        questionText:
          "A package declares `\"exports\": { \".\": \"./dist/index.js\" }` and nothing else. A consumer writes `require('pkg/internal/util')`. What happens?",
        options: [
          "It works — `exports` is treated as a hint, not a hard rule",
          "It fails with ERR_PACKAGE_PATH_NOT_EXPORTED, because `exports` blocks any subpath that isn't listed",
          "It silently falls back to the legacy `main` field",
          "It works but logs a deprecation warning",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "You run `npm uninstall pkg --no-save`. What actually changes on disk?",
        options: [
          "Both package.json and node_modules/pkg/ are removed",
          "Only node_modules/pkg/ is removed; package.json still lists it as a dependency",
          "Nothing changes (the `--no-save` flag cancels the uninstall)",
          "package.json is updated but node_modules/ is left untouched",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "What's the canonical, modern way to install ONLY production dependencies on a server?",
        options: [
          "`npm install --no-dev`",
          "`npm install --omit=dev` (or run with NODE_ENV=production)",
          "`npm prune` after a normal install",
          "`npm install --production-only`",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "`require('react')` in your code works under npm even though you didn't list react in your direct dependencies (it's pulled in transitively). The same code crashes under pnpm by default. Why?",
        options: [
          "pnpm doesn't support react",
          "npm flattens transitive deps into the top-level node_modules/, so transitive packages happen to be requirable; pnpm uses an isolated, symlinked store so only your DIRECT deps are accessible",
          "pnpm only supports ESM, not CommonJS",
          "npm caches node_modules differently between platforms",
        ],
        correctIndex: 1,
      },
    ],
  },

  {
    title: "Stack Identifier",
    description: HARD_QUIZ_INTRO + " Topic: framework-specific syntax and behaviour where AI tools confuse one for another.",
    type: "quiz",
    anchorSession: 14,
    pointsReward: 100,
    badgeEmoji: "🔍",
    badgeName: "Framework Profiler",
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "A file named `+page.server.ts` belongs to which framework's filesystem router?",
        options: ["Next.js (App Router)", "Remix", "SvelteKit", "Nuxt"],
        correctIndex: 2,
      },
      {
        questionText:
          "Why does Next.js App Router require `\"use client\"` at the top of certain component files?",
        options: [
          "To enable React's strict mode for that file",
          "Because React Server Components are the default in App Router; the directive opts a module into client rendering and bundling",
          "It's a TypeScript pragma controlling type-check strictness",
          "It tells webpack to bundle the file rather than tree-shake it",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "A route file path written as `app/routes/$id.tsx` (with a `$` for the dynamic segment) belongs to which framework?",
        options: [
          "Next.js App Router",
          "Remix (and React Router v7 framework mode)",
          "SvelteKit",
          "Angular",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which of these, placed inline in the RENDER body of a Next.js component, will cause a hydration mismatch?",
        options: [
          "Reading `window.innerWidth` inside a `useEffect`",
          "Calling `Math.random()` directly in JSX during render",
          "Referencing `process.env.NEXT_PUBLIC_FOO`",
          "Using `useState(0)` at the top of the component",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which directive marks a function as a server action in Next.js App Router?",
        options: ["\"use server\"", "\"server only\"", "\"action\"", "@server"],
        correctIndex: 0,
      },
      {
        questionText:
          "A page file at `pages/about.vue` containing a `<script setup>` block belongs to:",
        options: ["Next.js", "Nuxt", "SvelteKit", "Astro"],
        correctIndex: 1,
      },
      {
        questionText:
          "Adding `client:idle` to an Astro component does what?",
        options: [
          "Removes the component from the build entirely",
          "Hydrates the component once the browser fires `requestIdleCallback`",
          "Pre-renders it only at build time, never on the server",
          "Forces it to render on the server on every request",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which best describes Partial Prerendering (PPR) in Next.js?",
        options: [
          "The whole page is fully pre-rendered at build time",
          "A static shell streams instantly, and dynamic 'holes' are filled in per request",
          "The page is regenerated every N seconds in the background",
          "The page renders entirely on the client with no server work",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which backend framework's selling point is that the SAME app runs on Node, Bun, Deno, AND Cloudflare Workers?",
        options: ["Express", "Fastify", "Hono", "NestJS"],
        correctIndex: 2,
      },
      {
        questionText:
          "In SvelteKit, `+page.server.ts` exports `export const actions = { default: async ({ request }) => { ... } }`. What does this handle?",
        options: [
          "Page-load data fetching on every navigation",
          "A POST submission to the same route from a <form> element (progressive enhancement built in)",
          "A WebSocket upgrade for that route",
          "A client-side navigation transition",
        ],
        correctIndex: 1,
      },
    ],
  },

  {
    title: "Merge Mastery",
    description: HARD_QUIZ_INTRO + " Topic: merging, rebasing, and history reconciliation as they actually behave.",
    type: "quiz",
    anchorSession: 14,
    pointsReward: 100,
    badgeEmoji: "🪢",
    badgeName: "Conflict Tamer",
    deadline: SESSION_DEADLINE,
    questions: [
      {
        questionText:
          "Git performs a fast-forward (rather than a true merge) when:",
        options: [
          "The two branches have unrelated histories",
          "The target branch's tip is an ancestor of the source branch's tip — i.e. no divergence",
          "The source branch has zero commits ahead",
          "You explicitly pass `--ff-only`",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Which flag forces git to create a merge commit even when a fast-forward would have been possible?",
        options: ["--ff-only", "--no-ff", "--squash", "--rebase"],
        correctIndex: 1,
      },
      {
        questionText:
          "You run `git merge --squash feature` on main, then commit. How many PARENTS does the resulting commit have?",
        options: [
          "Two — like any merge commit",
          "One — it's a regular commit, not a merge; the feature branch is NOT in the parent chain",
          "Zero — squash detaches it",
          "Three — squash adds the merge base as a third parent",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "Compared to plain `git pull`, what does `git pull --rebase` produce?",
        options: [
          "The exact same result; --rebase is just an alias",
          "A merge commit on top of the remote's changes",
          "A linear history: your local commits are replayed on top of the remote tip, with no merge commit",
          "A detached HEAD requiring manual cleanup",
        ],
        correctIndex: 2,
      },
      {
        questionText:
          "In `git rebase --onto NEW OLD branch`, what does the OLD argument identify?",
        options: [
          "The new base commit to replay onto",
          "The upstream the branch was previously based on — used to compute WHICH commits to replay (those after OLD that are reachable from `branch`)",
          "The current tip of the branch you're rebasing",
          "A tag name; --onto only accepts tags, not SHAs or branches",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "You hit a conflict during `git rebase main` (while standing on `feature`). Which side does `<<<<<<< HEAD` (\"ours\") refer to?",
        options: [
          "Your feature branch's version of the file",
          "main's version — because during a rebase, your commits are replayed ON TOP, so HEAD is currently main's tip when the conflict occurs; \"ours\" feels flipped vs a normal merge",
          "Always the older of the two commits",
          "Always the newer of the two commits",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "You hit a conflict during `git merge feature` (while standing on `main`). Which side is \"ours\"?",
        options: [
          "The branch being merged in (feature)",
          "The current branch (main)",
          "Always the older commit",
          "There is no \"ours\" during a merge — only during rebase",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "When git performs a three-way merge, what is the third side it diffs against — the \"merge base\"?",
        options: [
          "The most recent commit on main",
          "The lowest common ancestor commit of the two branches being merged",
          "The first commit in the repository",
          "The current HEAD only — there's no third side",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "What is an \"octopus\" merge?",
        options: [
          "Any merge that produces more than 8 conflict hunks",
          "A single merge commit that combines MORE than two branches at once (has 3+ parents)",
          "A rebase that touches commits from multiple authors",
          "A merge that was force-pushed over a teammate's work",
        ],
        correctIndex: 1,
      },
      {
        questionText:
          "What does `git rerere` (reuse recorded resolution) do?",
        options: [
          "Re-runs the most recent rebase from the beginning",
          "Re-applies a conflict resolution you've already solved by hand once, whenever the same conflict surfaces again",
          "Renames the currently checked-out branch",
          "Removes redundant remotes from .git/config",
        ],
        correctIndex: 1,
      },
    ],
  },
];

async function seed() {
  console.log(`Seeding ${SEED.length} hard-research quiz challenges…\n`);

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
        deadline: c.deadline ?? null,
        decayEnabled: false,
        decayStartPoints: 40,
        decayPointsPerInterval: 1,
        decayIntervalSeconds: 600,
      })
      .returning({ id: challenges.id });

    await db.insert(quizQuestions).values(
      c.questions.map((q, i) => ({
        challengeId: row.id,
        questionText: q.questionText,
        options: JSON.stringify(q.options),
        correctIndex: q.correctIndex,
        orderIndex: i,
      }))
    );

    console.log(
      `  [ok]   "${c.title}" (quiz, session ${c.anchorSession}) → id ${row.id} + ${c.questions.length} q`
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
