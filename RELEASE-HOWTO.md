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
You click "Run workflow" button in GitHub Actions
          ↓
release.yml starts
          ↓
Runs: node scripts/release-orchestrator.js --mode stable ...
          ↓
Script reads release.config.json (list of repos to release)
          ↓
For each repo listed:
  - Clone if missing (optional)
  - npm install
  - npm test
  - npm run build
  - npm version (bump patch/minor/major)
  - npm publish (to npm registry)
  - git push + tags (for stable only)
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
- **Use case:** Pre-release versions for testing

**Scenario 3: GitHub Stable Release**
- Click Actions → "Solidos Release" → Run workflow
- Inputs: mode=stable, dry_run=false
- Publishes to npm with `@latest` tag
- Creates git tags and pushes to GitHub
- Results in GitHub Actions logs and artifacts
- **Use case:** Production releases

Local dry-run
- Show the exact commands without running them:
  node scripts/release-orchestrator.js --mode test --dry-run

CI runs (GitHub Actions)
- Trigger workflow "Solidos Release" with inputs:
  - mode: test or stable
  - config: release.config.json (or another config file)
  - dry_run: true or false
  - clone_missing: true or false

Branch Configuration

By default, both test and stable modes use the `main` branch. To use different branches:

**Example release.config.json with separate branches:**
```json
{
  "defaultBranch": "main",
  "modes": {
    "test": {
      "branch": "develop",
      "versionBump": "prerelease",
      "preid": "test"
    },
    "stable": {
      "branch": "main",
      "versionBump": "patch"
    }
  },
  "repos": [
    {
      "name": "solid-panes",
      "path": "./workspaces/solid-panes"
    }
  ]
}
```

Now:
- Test releases pull from `develop` branch
- Stable releases pull from `main` branch

Publish modes
- test:
  - npm version prerelease --preid test
  - npm publish --tag test
  - does NOT create git tags or push
- stable:
  - npm version patch (or configured bump)
  - npm publish (latest)
  - creates git tags and pushes by default

Multiple configs
- Create additional config files (for example):
  - release.config.json
  - release.config.test.json
  - release.config.hotfix.json
- Use with: --config release.config.test.json

Skip logic
- If there is no git diff vs origin/main (or configured branch), the repo is skipped.

Summary output
- A summary is printed at the end and written to release-summary.json.
- Override with: --summary-path path/to/summary.json

npm install test builds
- npm install <pkg>@test installs the latest package published under the "test" dist-tag.
- You can also install a specific test version by pinning it explicitly.

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
```

**Important:** Waiting PRs are NOT automatically published. You must manually trigger the release after merging.
