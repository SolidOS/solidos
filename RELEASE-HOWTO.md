# SolidOS Release Orchestrator — How To

`scripts/release-orchestrator.js`, driven by `.github/workflows/release.yml`, publishes the
SolidOS package chain from a single manual Actions trigger.

```
solidos/  (branch: main)
├── .github/workflows/
│   └── release.yml                  ← manual trigger only (workflow_dispatch)
├── scripts/
│   └── release-orchestrator.js      ← does the work
├── release.config.json              ← repo list, mode defaults
├── release.config.<variant>.json    ← extra configs, selected at trigger time
└── workspaces/
    ├── solid-panes/
    ├── mashlib/
    └── …
```

Nothing special is required inside the individual repos beyond a `package.json` with the
scripts the config names, and a `ci.yml` that publishes `@latest` on `main` (see
[Publishing is delegated to repo CI](#publishing-is-delegated-to-repo-ci)).

---

## TL;DR

| Goal | Trigger |
|------|---------|
| See what a run would do | locally: `--dry-run=true` (mandatory locally) |
| Prerelease to npm `@test` | `mode=test` |
| Protected `main`: PR → merge → repo CI publishes | `mode=stable-publish` |
| Unprotected `main`: push + orchestrator publishes | `mode=stable` |
| Only open the release PR, human merges | `mode=stable-prepare-pr` |

---

## Modes

| Mode | Starts from | Branch created | Merge strategy | Who runs `npm publish` | npm tag |
|------|-------------|----------------|----------------|------------------------|---------|
| `test` | target branch | — | — | orchestrator | `test` |
| `stable` | target branch (+ source merged in) | — | direct push to target | orchestrator | `latest` |
| `stable-prepare-pr` | **source** branch | `release/<pkg>-<timestamp>` | PR, **not** auto-merged | — (no publish) | — |
| `stable-publish` | **target** branch | `release/<pkg>-<timestamp>` | PR, auto-merged (required) | each repo's `ci.yml` on `main` | `latest` |

Effective config for both PR modes forces `gitPush: false` and `gitTag: false`; the PR merge
is what lands on `main`.

The `Step 1/3 / 2/3 / 3/3` lines in the log are cosmetic — step 3 does not publish anything.

---

## Branch model

Two independent notions, resolved differently.

**Target branch** — where the release lands:

```
--branch  →  repo.branch  →  modes[mode].branch  →  config.defaultBranch  →  'main'
```

**Source branch** — what gets merged into the target. Used only by `stable` and
`stable-prepare-pr`:

```
repo.releaseSourceBranch → repo.sourceBranch → modes['stable-publish'].sourceBranch
  → modes.stable.sourceBranch → config.releaseSourceBranch → modes.test.branch → target
```

Consequences worth knowing:

- **`stable-publish` never reads the source branch.** It branches straight off the target
  (`main`), so commits sitting on `staging` cannot reach a `stable-publish` release. They
  flow in through `afterInstall` (`npm install <pkg>@latest`), not through a merge.
- **`--branch` sets the target only**, never the source.
- If the configured source does not exist on `origin`, it silently falls back to the target
  with a warning. In dry-run the existence check is skipped.
- With a config that has no `releaseSourceBranch` and no `modes.stable.sourceBranch`, the
  fallback reaches `modes.test.branch` — for a typical config that means `stable` would try
  to merge **`dev`**. Set `releaseSourceBranch` explicitly if you use `stable`.

---

## `stable-publish` in detail

Per repo, in `repos` array order:

1. `ensureBranch` → `git fetch --all`, `git switch <target>`, `git pull --ff-only origin <target>`.
2. `createReleaseBranch` → `git switch -c release/<pkg>-<timestamp>`, after
   `ensureCiPushAccess` verifies with `git push --dry-run origin HEAD:<branch>`.
3. `npm install` (or `repo.install` / `defaultInstall`), then `beforeInstall` / `afterInstall`
   steps — this is where released dependencies are pulled in.
4. `lockStableDependencyVersions` — pins the installed versions of every package named in
   `afterInstall` (see [Dependency locking](#dependency-locking)).
5. Tests, then build (`defaultTest` / `defaultBuild`), plus any `before*` / `after*` hooks.
6. `bumpStableVersion` — patch bump by default, committed as `Release <v> [skip ci]`.
7. Push the release branch, then `gh pr create` (**required** — fails the repo if this fails).
8. `waitForPRMerge` with `required: true`:
   - waits up to 2 min for the PR to become visible;
   - requests `gh pr merge --merge --auto --delete-branch`;
   - polls up to 20 min on `state`, `mergeStateStatus`, `statusCheckRollup`;
   - if the PR stays `BLOCKED` with zero checks, force-pushes an empty commit
     (`Trigger CI checks`) to re-fire the `pull_request` event so required checks materialize;
   - falls back to `--admin` merge only once checks exist and are green;
   - hard-fails after ~2 min of `BLOCKED` with no checks, or immediately on a failing check;
   - then `git reset --hard`, `git clean -fd`, checkout target, `git pull`.
9. Waits for `<repoCiWorkflow>` (default `ci.yml`, 20 min) to succeed **on the target HEAD**.
10. Polls npm (10 min) for `name@version`; timeout is a hard error.
11. Summary status: `published-by-repo-ci`.

`skipIfNoDiff` is **not** consulted in `stable-publish` — the release branch always exists
because `afterInstall` is expected to change the dependency versions.

### Publishing is delegated to repo CI

`stable-publish` ends at step 10. It does not run `npm publish`. Each target repository's
`ci.yml` publishes `@latest` when a version bump lands on `main`. This keeps exactly one
publisher for `latest`, so the orchestrator's npm publish and the repo CI publish cannot
race or double-publish.

Two knock-on effects:

- The version bumped by the orchestrator **must** be one the repo CI will publish, and it
  cannot be re-used. `npm publish` cannot overwrite.
- `mashlib` is listed after `solid-panes` in the config, but the orchestrator waits for
  `solid-panes@<version>` to appear on npm before it starts `mashlib`, so the ordering holds.

---

## Branch hygiene: `main`, `staging`, `release/*`

- `staging` = `main` + a prerelease version. Prepared locally on `mainToStaging`. The
  invariant is `origin/main` is an ancestor of `origin/staging`.
- Release changes **never** go to `main` directly. They go to a branch, then a PR.
- `.github/workflows/update-solidos-deps.yml` (the shared sync job) pins `dev` builds only
  on non-released branches: `main` and `release/*` are exempt. Without that exemption, the
  bot dev-pins the very release PR being merged, and an unreleased prerelease gets published
  under `latest`.

---

## Tokens and preconditions

| Env var | Used for |
|---------|----------|
| `GIT_PUSH_TOKEN` | clone, push, `gh` API (`preferGhToken` copies it to `GH_TOKEN` when `GH_TOKEN` is unset) |
| `GITHUB_TOKEN` | fallback for git push |
| `NPM_TOKEN` | test/stable publish from the orchestrator; repo CI handles `stable-publish` |

Setup:

1. Fine-grained PAT, resource owner `SolidOS`.
2. Repository access: the repos in the config ("Only select repositories" or all).
3. Permissions: `Contents: Read and write`, `Metadata: Read`, optionally `Actions: Read`.
4. Store as repo secret `GIT_PUSH_TOKEN` in `solidos/solidos`, plus `NPM_TOKEN`.
5. If branch protection blocks direct push, use `stable-publish` (PR flow) rather than asking
   the token to bypass rules.

Do not grant `delete_repo` or `delete:packages`. Use a dedicated token and rotate it.

Also required in CI: the `gh` CLI, and a clean working tree (`ensureClean`). Locally, a
non-dry-run invocation throws: *Publishing is only allowed in GitHub Actions.* In CI,
`clone_missing` is forced to `true`.

---

## CLI

```
node scripts/release-orchestrator.js [--mode <mode>] [--config <path>] \
  [--dry-run[=true|false]] [--clone-missing[=true|false]] \
  [--branch <name>] [--summary-path <path>]
```

| Option | Default | Notes |
|--------|---------|-------|
| `--mode` | `stable` | `test` \| `stable` \| `stable-prepare-pr` \| `stable-publish` |
| `--config` | `release.config.json` | resolved against the current directory |
| `--dry-run` | `false` | mandatory locally |
| `--clone-missing` | `false` | forced `true` in CI |
| `--branch` | — | target branch override; also disables the `stable` no-diff skip |
| `--summary-path` | `release-summary.json` | written even when the run fails |

Booleans accept `--flag=true`, `--flag true`, or a bare `--flag` (meaning true). Unknown
flags are ignored rather than rejected. There is no `--repo` filter — narrow a run by
editing the config's `repos` array.

---

## Config reference

`modes` may be an object keyed by mode name (usual form) or an array of `{ "name": … }`
entries; both are accepted.

```json
{
  "defaultBranch": "main",
  "skipIfNoDiff": true,
  "defaultInstall": "npm install",
  "defaultTest": "npm test",
  "defaultBuild": "npm run build",
  "modes": {
    "stable": {
      "branch": "main",
      "versionBump": "patch",
      "npmTag": "latest",
      "gitTag": true,
      "gitPush": true
    },
    "test": {
      "branch": "dev",
      "versionBump": "prerelease",
      "preid": "test",
      "npmTag": "test",
      "gitTag": false,
      "gitPush": false
    }
  },
  "repos": [
    {
      "name": "solid-panes",
      "path": "workspaces/solid-panes",
      "repo": "https://github.com/SolidOS/solid-panes.git",
      "afterInstall": [
        "npm install folder-pane@latest solid-ui@latest solid-logic@latest rdflib@latest"
      ]
    }
  ]
}
```

Top level: `defaultBranch`, `skipIfNoDiff`, `defaultInstall`, `defaultTest`,
`defaultBuild`, `modes`, `repos`, and the optional globals below.

Per repo: `name`, `path`, `repo` (needed for `gh` and for CI clones), `branch`,
`install`, `test`, `build`, `skipIfNoDiff`, `sourceBranch`, `releaseSourceBranch`,
and the step arrays `beforeInstall` / `afterInstall` / `beforeTest` / `afterTest` /
`beforeBuild` / `afterBuild` / `beforePublish` / `afterPublish`.

Optional tuning keys (mode level or top level, mode wins):

| Key | Purpose |
|-----|---------|
| `sourceBranch` | source branch for `stable` / `stable-prepare-pr` |
| `releaseSourceBranch` | same, top-level form |
| `lockDependencyFields` | default `["dependencies","devDependencies"]` |
| `lockDependencyPrefix` | default `^` |
| `lockInstallCommand` | default `npm install` (run to refresh the lockfile) |
| `lockCommitMessage` | default `chore(release): lock tested dependency versions [skip ci]` |
| `requiredChecksWorkflow` | default `ci.yml` — workflow whose checks gate the merge |
| `repoCiWorkflow` | default `ci.yml` — workflow awaited on `main` after merge |
| `repoCiWorkflowTimeoutMs` / `repoCiWorkflowPollIntervalMs` | default 20 min / 15 s |
| `repoCiPublishTimeoutMs` / `repoCiPublishPollIntervalMs` | default 10 min / 5 s |
| `autoCommitBeforeVersion` | auto-commit dirty tree before the bump (default true in CI) |
| `preVersionCommitMessage` | default `chore(release): sync release prep changes [skip ci]` |

---

## `afterInstall` and dist-tags

`afterInstall` runs after `npm install`, with the mode's npm tag injected into bare package
names:

- **`test`** → `npm install solid-ui` becomes `npm install solid-ui@test`, falling back to
  `@latest` if the `test` dist-tag does not exist.
- **`stable` / `stable-publish`** → `@latest` behaviour (explicit tags are preserved).

**Always write `@latest` explicitly when you want an upgrade.** A bare name is installed at
whatever version `package.json` already pins; if the pin is exact (`4.1.0`), the command is
a no-op and the release ships the old dependency while looking perfectly healthy.

---

## Dependency locking

For `stable` and `stable-publish`, `lockStableDependencyVersions`:

1. Collects every package named in the repo's `afterInstall` steps.
2. Reads the version actually installed in `node_modules`.
3. Rewrites the matching `dependencies` / `devDependencies` entry to `^<installed>`
   (`lockDependencyPrefix` overrides the caret).
4. Runs `lockInstallCommand` to refresh `package-lock.json`.
5. Commits `package.json` + lockfile as `chore(release): lock tested dependency versions [skip ci]`.

This is what makes the published package declare the versions that were actually tested,
rather than floating ranges.

---

## Version bump

`versionBump` (default `patch`) is applied with `npm version`:

- `gitTag: true` → `npm version <bump> -m "Release %s"`, tag created and pushed.
- `gitTag: false` (both PR modes) → `npm version <bump> --no-git-tag-version`, then an
  explicit `git commit -m "Release <v> [skip ci]" --allow-empty`.

Lifecycle scripts are skipped (`--ignore-scripts`). A dirty tree is either auto-committed
(`autoCommitBeforeVersion`, true in CI) or rejected by `ensureCleanBeforeVersion`.

---

## Skip logic

- **`test`** — always publishes.
- **`stable`** — compares `target..origin/<source>`; `0` commits → skip (`no-diff`), unless
  `--branch` was passed or `skipIfNoDiff: false`. Otherwise merges the source in
  (`Merge <source> into <target> for release [skip ci]`) and publishes.
- **`stable-prepare-pr`** — same comparison; skip if no diff; otherwise opens the PR.
- **`stable-publish`** — never skips.

---

## Summary output

A summary is printed and written to `--summary-path` (default `release-summary.json`) in a
`finally` block, so it is emitted even when a repo fails. Statuses:
`published`, `published-by-repo-ci`, `dry-run`, `prepared-pr`, `skipped`, `failed`.

A dry run writes `release-summary.json` into the directory you ran it from — expect it in
`git status`.

---

## Related workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `release.yml` (solidos) | manual | runs the orchestrator |
| `<repo>/ci.yml` | push / PR | tests, build, and `npm publish` of `@latest` on `main` |
| `update-solidos-deps.yml` (solidos, reusable) | called by each repo's `ci.yml` | syncs declared SolidOS dependency versions from the registry |

`update-solidos-deps.yml` pins each package listed in the repo's `solidosDependencies` to
the `dev` build when newer, else `latest`; it deletes `node_modules` + `package-lock.json`,
reinstalls, and commits `chore: update solidos dependencies …`. Pushes are
warn-and-continue, so a rejected push is easy to miss.

---

## Known gotchas

- **A published version is burned.** `npm publish` cannot overwrite. Fix forward with a new
  bump; do not retry the same version.
- **Prereleases do not satisfy `^` ranges.** `^3.1.1` never admits `3.2.0-0`. Peer ranges
  that must accept both need a union: `>=3.1.1 <6.0.0 || >=5.1.2-0 <6.0.0`.
- **The dev-pinning bot and the release are coupled.** A `dev`-pinned release branch produces
  a `latest` version with prerelease dependencies. Hence the `main|release/*` exemption.
- **Errors mask each other.** Dev pins can satisfy peer ranges that released versions would
  violate, so a broken peer range only surfaces after the pinning bug is fixed.
- **`staging` is invisible to `stable-publish`.** If a fix only lives on `staging`, release it
  through npm first, then let `afterInstall` pull it in.
- **`--branch` ≠ source.** It overrides the target branch for every repo in the config.
- **The pre-merge guard is dead code.** `ensureMainContainsStableChanges` is defined but never
  called, so nothing verifies the target is caught up with a source branch.

---

## References

- Orchestrator: `scripts/release-orchestrator.js`
- Workflow: `.github/workflows/release.yml`
- Dependency sync: `.github/workflows/update-solidos-deps.yml`
- Historical run notes: `RELEASE-STATUS.md`
