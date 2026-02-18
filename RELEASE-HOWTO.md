Solidos Release Orchestrator - How To

## Quick Summary

The Solidos monorepo uses a **centralized release orchestrator** to publish all dependent packages at once.

```
solidos/ (main branch)
├── .github/workflows/
│   └── release.yml                 ← Manual GitHub Actions trigger
├── scripts/
│   └── release-orchestrator.js     ← Does the actual work
├── release.config.json             ← Lists repos to publish (stable mode)
├── release.config.test.json        ← Lists repos to publish (test mode)
└── workspaces/
    ├── solid-panes/                ← Nothing special needed
    ├── folder-pane/                ← Nothing special needed
    └── (other repos)               ← Nothing special needed
```

## How It Works

**Three execution modes:**

| Scenario | Command | Where | Publishes? |
|----------|---------|-------|-----------|
| **Local Testing** | `node scripts/release-orchestrator.js --dry-run=true` | Your computer | ❌ No (prints what would happen) |
| **Test Release** | Manual trigger: mode=test | GitHub Actions | ✅ Yes (@test tag) |
| **Stable Release** | Manual trigger: mode=stable | GitHub Actions | ✅ Yes (@latest tag) |

**Workflow:**
```
You click "Run workflow" button in GitHub Actions (mode=test or mode=stable)
          ↓
release.yml starts
          ↓
Runs: node scripts/release-orchestrator.js --mode <test|stable> ...
          ↓
Script reads release.config.json (list of repos to release)
          ↓
For each repo listed:
  - Clone if missing (optional)
  - Checkout branch (dev for test, main for stable)
  - npm install
  - afterInstall with @test or @latest tags (with fallback)
  
  [Stable mode only: Check skip logic]
    - Compare origin/dev vs main
    - If dev has new commits → merge origin/dev into main with [skip ci]
    - If no changes and --branch not specified → skip this repo
  
  [Test mode: always continues]
  
  - npm test
  - npm run build
  - npm version (bump patch/minor/major/prerelease)
  - npm publish (to npm registry with @test or @latest tag)
  - git push + tags (stable only)
          ↓
Generates release-summary.json
```

## Key Points

- **Individual repos need nothing special** — they just need `package.json` and npm scripts
- **All repos already exist in GitHub** — clone-missing is a fallback only
- **Branches are configurable** — typically main for stable, develop for test
- **Both test and stable default to main** — configure in release.config.json if you want different branches
- **PR workflow is unaffected** — each repo's ci.yml still runs for PRs
- **Waiting PRs won't auto-publish** — you manually trigger the release

## Overview
- This repository uses a multi-repo release orchestrator to publish dependent packages.
- Publishing is only allowed in GitHub Actions; local runs must use --dry-run.
- Test publishes use a prerelease version and the npm dist-tag "test" so @latest is unaffected.

Files
- release.config.json: repo list and per-repo overrides.
- scripts/release-orchestrator.js: the release runner.
- .github/workflows/release.yml: GitHub Actions workflow.

Three Execution Scenarios

**Scenario 1: Local Dry-Run (Testing)**
```bash
cd d:\github\solidos
node scripts/release-orchestrator.js --mode test --dry-run=true
```
- Runs on your computer
- Prints commands without executing them (prefixed with `[dry-run]`)
- Creates `release-summary.json` locally
- No publishing occurs
- **Use case:** See exactly what would happen before running for real

**Scenario 2: GitHub Test Release**
- Click Actions → "Solidos Release" → Run workflow
- Inputs: mode=test, dry_run=false
- Publishes to npm with `@test` tag
- Does NOT create git tags
- Results in GitHub Actions logs and artifacts
- **Always publishes** (no skip logic)
- **Use case:** Pre-release versions for testing from dev branch

**Scenario 3: GitHub Stable Release**
- Click Actions → "Solidos Release" → Run workflow
- Inputs: mode=stable, dry_run=false
- Automatically merges origin/dev → main if dev has new commits
- Publishes to npm with `@latest` tag
- Creates git tags and pushes to GitHub
- Results in GitHub Actions logs and artifacts
- Skips if dev has no new commits (unless --branch=main specified)
- **Use case:** Production releases to @latest

Local dry-run
- Show the exact commands without running them:
  node scripts/release-orchestrator.js --mode test --dry-run
- Override the branch:
  node scripts/release-orchestrator.js --mode test --dry-run --branch develop
- Force stable publish regardless of changes:
  node scripts/release-orchestrator.js --mode stable --branch main
- Dry-run allows untracked files (ignored for convenience)

CI runs (GitHub Actions)
- Trigger workflow "Solidos Release" with inputs:
  - mode: test or stable
  - config: release.config.json (or another config file)
  - dry_run: true or false
  - clone_missing: true or false
  - branch: optional branch name override

Command-line Options
- --mode: test or stable (default: stable)
- --config: path to config file (default: release.config.json)
- --dry-run: true or false (default: false)
- --clone-missing: true or false (default: false)
- --branch: override branch for all repos (optional)
  - Also disables skip logic in stable mode (forces publish)
- --summary-path: path to output summary file (default: release-summary.json)

Branch Configuration

By default, both test and stable modes use the `main` branch. To use different branches:

**Example release.config.json with separate branches:**
```json
{
  "defaultBranch": "main",
  "modes": [
    {
      "name": "test",
      "branch": "dev",
      "versionBump": "prerelease",
      "preid": "test",
      "npmTag": "test"
    },
    {
      "name": "stable",
      "branch": "main",
      "versionBump": "patch",
      "npmTag": "latest"
    }
  ],
  "repos": [
    {
      "name": "solid-panes",
      "path": "./workspaces/solid-panes",
      "afterInstall": [
        "npm install profile-pane"
      ]
    }
  ]
}
```

Behavior:
- **Test mode:** 
  - Pulls from `dev` branch
  - Always publishes (no skip)
  - afterInstall `npm install profile-pane` becomes `npm install profile-pane@test || npm install profile-pane@latest`
- **Stable mode:**
  - Pulls from `main` branch
  - Auto-merges origin/dev if it has new commits
  - Skips if no changes (unless --branch=main specified)

Publish modes
- test:
  - Runs on: dev branch (or configured branch)
  - npm version prerelease --preid test
  - npm publish --tag test --ignore-scripts
  - does NOT create git tags or push
  - **Always publishes** (no skip check)
  - afterInstall commands use @test tag with @latest fallback
- stable:
  - Runs on: main branch (or configured branch)
  - Checks if origin/dev has commits that main doesn't
  - If yes: auto-merges origin/dev → main (may fail on conflicts)
  - npm version patch (or configured bump)
  - npm publish (latest) with --ignore-scripts
  - creates git tags and pushes by default
  - Skips if no changes (unless --branch explicitly specified)
  - afterInstall commands use @latest tag

Multiple configs
- Create additional config files (for example):
  - release.config.json
  - release.config.test.json
  - release.config.hotfix.json
- Use with: --config release.config.test.json

Skip logic
- **Test mode:** Always publishes (no skip logic)
- **Stable mode:**
  - Compares origin/dev vs main to detect unpublished changes
  - If origin/dev has commits that main doesn't: merges and publishes
  - If no changes: skips publishing
  - Override: `--branch=main` forces publish regardless of changes
  - Merge happens automatically before publish (fails if conflicts)
  - Merge commit includes `[skip ci]` to prevent redundant ci.yml runs

Summary output
- A summary is printed at the end and written to release-summary.json.
- Override with: --summary-path path/to/summary.json

npm install with dist-tags
- **Test mode:** afterInstall commands automatically inject @test tags
  - Example: `npm install solid-ui` becomes `npm install solid-ui@test`
  - Fallback: If @test doesn't exist, tries @latest automatically
  - Command: `npm install solid-ui@test || npm install solid-ui@latest`
- **Stable mode:** afterInstall commands use @latest tags (default npm behavior)
- Manual install: `npm install <pkg>@test` to get test versions

Config options (release.config.json)
- defaultBranch: branch name used if repo does not override.
- skipIfNoDiff: skip publish if no diff vs origin.
- defaultInstall / defaultTest / defaultBuild: commands for all repos.
- modes: publish behavior for "stable" and "test".
- repos: per repo configuration:
  - name (required)
  - path (required)
  - repo (optional, needed for CI clone)
  - branch (optional override)
  - install/test/build (optional overrides)
  - before*/after* arrays for custom steps

Notes
- CI uses npm OIDC with NODE_AUTH_TOKEN set in GitHub Actions.
- If a repo requires special install steps, add them under afterInstall in the config.

Individual Repos and Their CI Workflows

Each workspace repo (solid-panes, folder-pane, etc.) has its own `ci.yml` workflow for PR testing. This is **independent** of the release orchestrator:

**Per-repo ci.yml (solid-panes/.github/workflows/ci.yml):**
- Triggers on: Push to main/develop, Pull requests
- Runs: Tests, linting, building
- Purpose: Verify code quality
- Used by: PRs waiting to be merged
- **Does NOT publish to npm**

**Central release.yml (solidos/.github/workflows/release.yml):**
- Triggers on: Manual button click only
- Runs: release-orchestrator.js
- Purpose: Publish all repos to npm at once
- Used by: Release maintainers
- **Does NOT run automatically on PRs or merges**

**Summary:**
```
┌─ PR Created
│  └─ ci.yml runs in each repo → blocks merge if tests fail
│
└─ PR Merged to main/develop
   └─ ci.yml finishes
   └─ [waiting for manual release trigger]
   └─ You click "Run workflow" in Actions
      └─ release.yml runs → publishes to npm
         └─ (stable mode) auto-merges dev→main with [skip ci]
         └─ pushes version tags and commits
         └─ ci.yml does NOT run (prevented by [skip ci])
```

**Important Notes:**
- Waiting PRs are NOT automatically published. You must manually trigger the release after merging.
- When stable mode merges dev→main automatically, it uses `[skip ci]` in the commit message to prevent redundant ci.yml runs in individual repos.
- Tests/builds already ran in the release orchestrator, so skipping ci.yml avoids duplicate work.
