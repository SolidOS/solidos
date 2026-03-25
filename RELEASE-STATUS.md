# Release Orchestrator - Current Status

**Date:** March 20, 2026  
**Status:** ✅ Single source of truth adopted for `latest` publish: repository `ci.yml` on `main`

---

## Checkpoint (March 20, 2026 - latest)

Final decision for stable releases:
- `stable-publish` in orchestrator now stops after PR merge.
- `latest` publication is delegated to each target repository's `ci.yml` on `main`.
- This removes duplicate publish attempts (orchestrator + repo CI) and keeps one publisher for `latest`.

Implemented commit in `solidos`:
- `8b1a5ef` — `refactor(release): delegate stable-publish latest publish to repo CI`

Versioning policy clarification:
- Source of truth for release version is `main`, not npm latest lookup.
- `stable-publish` should bump from `main` state and merge that bump via PR.

Next run planned:
1. Execute `release.yml` on branch `release` for `pane-registry` in `stable-publish` mode.
2. Expect orchestrator summary status `published-by-repo-ci` (no direct npm publish in step 3).
3. Confirm `pane-registry` `ci.yml` on `main` performs the single `latest` publish.

---

## Checkpoint (March 20, 2026 - final)

**BREAKTHROUGH**: `stable-publish` now successfully creates release PR, triggers required CI checks, merges, and completes step 2/3.

### Problem Solved
- Required checks (`build (22)` / `build (24)`) were configured on `main` ruleset but not triggering for release PRs.
- Cause: `ci.yml` listeners to `pull_request` event, which only fires on natural PR creation; orchestrator was trying workflow dispatch (wrong event type).
- Solution: Force-push an empty commit to the release branch → GitHub re-fires `pull_request` event → CI runs and checks post back to PR → merge proceeds.

### Changes in orchestrator
- Commit `375b0cc`: Added `git reset --hard && git clean -fd` before checkout to handle uncommitted changes left after empty-commit force-push.
- Earlier commits: CI-trigger via empty commit (commit `93b14ca`), transient error handling, required-checks diagnostics.

### Result (from last run, PR #228)
```
Found PR #228. Requesting auto-merge...
  PR #228: state=OPEN, mergeState=BLOCKED, review=UNKNOWN, pendingChecks=0, failingChecks=0
  PR #228: state=OPEN, mergeState=BLOCKED, review=UNKNOWN, pendingChecks=0, failingChecks=0
... (2 poll cycles) ...
  Pushed empty commit to release/solid-logic-202603201747 to trigger PR CI checks.
  PR #228: state=OPEN, mergeState=BLOCKED, review=UNKNOWN, pendingChecks=2, failingChecks=0
  PR #228: state=OPEN, mergeState=BLOCKED, review=UNKNOWN, pendingChecks=1, failingChecks=0
  PR #228: state=MERGED, mergeState=UNKNOWN, review=UNKNOWN, pendingChecks=1, failingChecks=0
PR #228 merged at 2026-03-20T17:49:44Z.
```
✅ **PR merged successfully.**

The only remaining error was `git checkout main` due to dirty working tree, which is now fixed by commit `375b0cc`.

### Future optimization
- User suggestion: Run CI earlier (before version bump) so it's ready when PR opens, avoiding need for empty-commit re-trigger.
- Feasibility: Needs testing; could reduce merge wait time from ~2min to ~30s.
- Implementation: Create release branch, push immediately, PR opens → CI runs → version bump → PR auto-merges (if CI passes quickly).

---
## Latest Test Run Results

```
Release summary:
- profile-pane: published 3.1.2-test.5 (test)
- solid-panes: published 4.2.3-test.0 (test)
- mashlib: published 2.1.3-test.0 (test)
Summary written to /home/runner/work/solidos/solidos/release-summary.json
```

## Authentication Setup (RESOLVED)

### Individual Repos (SolidOS org)
- **ci.yml workflows** use OIDC authentication
- `permissions: id-token: write`
- No secrets needed
- npm trusted publisher: `SolidOS/solid-panes` → `solid-panes` package
- Works perfectly with npm provenance

### Central Orchestrator (solidos/solidos repo)
- **release.yml** uses manual token (`NODE_AUTH_TOKEN`)
- Cannot use OIDC due to npm limitation: **one trusted publisher per package**
- Packages already trust their individual repos, can't add second trusted publisher
- Token requires: Granular Access Token with "Bypass 2FA" permission ✅
- Added `--no-provenance` flag to prevent provenance conflicts

**Why solid-panes had 403 but profile-pane worked:**
- solid-panes was published with provenance via OIDC before
- npm expected provenance on subsequent publishes
- Manual token can't provide provenance
- Solution: `--no-provenance` flag explicitly opts out

---

## Clarified Objectives (March 19, 2026)

1. Stable releases should be published from `main` (or an equivalent production branch), not from feature/dev branches.
2. `stable-prepare-pr` should focus on preparing a merge path from development branch to `main` and surfacing merge conflicts early.
3. `stable-publish` should run after `main` is updated, then version and publish from that updated `main` state.
4. Branch override remains available for special cases, but the default and recommended stable target is `main`.

### ✅ Completed Features

1. **Mode-specific npm tag injection**
   - Test mode: `npm install pkg@test || npm install pkg@latest`
   - Stable mode: `npm install pkg@latest`
   - Fallback pattern works correctly

2. **Skip logic**
   - Test mode: Always publishes (no skip)
   - Stable mode: Compares `origin/dev` vs `main`, skips if identical
   - `--branch` parameter overrides skip logic

3. **Auto-merge for direct stable mode**
   - Merges `origin/dev` → `main` before publishing
   - Commit message includes `[skip ci]` to prevent triggering individual ci.yml

4. **Stable publish PR flow (current implementation)**
  - `mode=stable-publish` creates a release branch from the selected target branch, bumps version there, opens PR, auto-merges, then publishes from the merged target branch.
  - This supports protected branches and guarantees publish happens after target branch is updated.
  - Merge mode is `--merge` (not squash) to preserve release/version commit history.

5. **Version collision handling**
   - Test mode: Checks if version exists, auto-bumps up to 5 times
   - Stable mode: Standard bump

6. **Lifecycle scripts disabled**
  - `--ignore-scripts` on `npm publish` prevents postpublish git push
  - `npm version ... --ignore-scripts` avoids dirty working tree issues

7. **Enhanced summary output**
   - JSON includes: `packageName`, `version`, `tag`, `publishedAs`
   - Written to `release-summary.json`

8. **Branch checkout improvements**
   - `git fetch --all` gets remote branches
   - `git switch` with fallback to create from origin

9. **Dry-run improvements**
   - Allows untracked files (friendly for local testing)

10. **Authentication**
   - release.yml uses `NODE_AUTH_TOKEN`
   - npm updated to latest in workflow
   - `--no-provenance` flag added to both publish commands

11. **CI git auth hardening**
  - Uses `GIT_PUSH_TOKEN` (preferred) and falls back to `GITHUB_TOKEN`
  - Authenticated clone URLs in runner mode
  - Preflight push check for direct stable mode to fail early on permission issues

---

## How Stable Mode Decides Whether to Publish

For each repo, the orchestrator runs this decision tree:

```
git rev-list --count main..origin/dev
      │
      ├─ 0 commits ahead ──► SKIP (already up to date)
      │
      └─ N commits ahead ──► MERGE + PUBLISH
             │
             ├─ git merge origin/dev  (local, inside runner clone)
             ├─ lock dependency versions in package.json
             ├─ git commit [skip ci]
             ├─ npm version patch      (bumps version + git tag)
             ├─ npm publish
             ├─ wait for npm registry propagation
             └─ git push origin main --follow-tags
```

**Override behaviour (direct stable mode):**
- `--branch <name>` on the CLI → skip the commit-count check entirely; always merge + publish
- `skipIfNoDiff: false` in config → same; always merge + publish
- Dry-run → commit-count check is also skipped (no real git state exists)

---

## Protected Branch Flow (Recommended)

When branch protection forbids direct push to `main`, the intended workflow is:

1. `mode=stable-prepare-pr`
  - Prepare/validate merge path from `dev` (or configured integration branch) into `main`
  - Surface merge conflicts early (without publishing)
2. Merge PR to `main` (manual or auto-merge policy)
3. `mode=stable-publish`
  - Version and publish from updated `main`

This keeps stable publication tied to `main` history and works with "PR required" rulesets.

Note: An optional enhancement under consideration is auto-merge during `stable-prepare-pr` to turn it into a conflict-check + merge stage before publish.

---

## Open Questions / Pending Decisions

### 0. gh CLI vs direct git push for main ✅ RESOLVED

**The problem:**  
The orchestrator currently merges `origin/dev` into `main` locally and then pushes:
```bash
git merge origin/dev -m "Merge dev into main for release [skip ci]"
# ... version bump, publish ...
git push origin main --follow-tags
```

**This works only if** the runner's token can push directly to `main`.  
If any SolidOS repo has a branch protection rule that requires pull requests (no direct push), this will fail with a 403.

**Two options:**

**Option A — Direct push (current approach)**  
- Works when branch protection allows the token or PAT to bypass.
- Requires `GIT_PUSH_TOKEN` (a PAT with "Allow bypassing branch protection") or repo rules configured to allow the Actions bot.
- Simpler code, no PR trail.

**Option B — PR-based merge via `gh` CLI**  
```bash
gh pr create --base main --head dev --title "Release [skip ci]" --body "Automated stable release"
gh pr merge --merge --auto
```
- Works even with strict branch protection ("Require a pull request before merging").
- Creates an audit trail (PR per release).
- Requires `gh` auth in the runner (`gh auth login` or `GH_TOKEN` env var).
- More complex: need to wait for PR to merge before continuing with publish.

**Outcome:**
- SolidOS repos use branch protection requiring PR before merge.
- Two-step stable flow was implemented (`stable-prepare-pr` + `stable-publish`).
- Direct `stable` mode remains available only for repos/environments that allow direct push.

---

### 1. Release Summary Artifact ⏳

**Current:** `release-summary.json` created but deleted after workflow ends

**Options:**
- **A. Upload as artifact** (recommended)
  ```yaml
  - name: Upload release summary
    uses: actions/upload-artifact@v4
    if: always()
    with:
      name: release-summary
      path: release-summary.json
      retention-days: 30
  ```
  Download from Actions tab → Workflow run → Artifacts section (bottom of page)

- **B. Cat in logs** (simple)
  ```yaml
  - name: Show release summary
    if: always()
    run: cat release-summary.json || echo "No summary generated"
  ```

- **C. Commit back to repo** (complex, probably overkill)

**Decision needed:** Which approach to implement?

---

### 2. Dependency Updates in Stable Mode ✅ IMPLEMENTED

**Current behavior:**
- Test mode: Dependencies are not locked in package.json (ephemeral behavior remains)
- Stable mode: Dependencies installed by `afterInstall` are now locked before publish

**Implemented algorithm (stable mode):**
```javascript
// After running afterInstall in stable mode:
1. Parse afterInstall commands to find installed packages
2. Get actual installed version from node_modules
3. Update package.json dependencies to exact version
4. npm install (to update package-lock.json)
5. git commit with [skip ci]
6. THEN do version bump and publish
```

**Example result:**
```json
{
  "version": "4.2.3",
  "dependencies": {
    "profile-pane": "3.1.2"  // Exact version tested
  }
}
```

**Defaults implemented:**
- Exact pins for reproducibility (no prefix)
- Update `dependencies` and `devDependencies` when keys already exist
- Order A: lock deps and commit first, then version bump and publish

**Optional config knobs supported:**
- `lockDependencyFields` (array)
- `lockDependencyPrefix` (string)
- `lockInstallCommand` (string)
- `lockCommitMessage` (string)

---

## Configuration Files

### release.config.json
```json
{
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
      "name": "profile-pane",
      "path": "../profile-pane",
      "afterInstall": []
    },
    {
      "name": "solid-panes",
      "path": "../solid-panes",
      "afterInstall": ["npm install profile-pane@latest"]
    },
    {
      "name": "mashlib",
      "path": "../mashlib",
      "afterInstall": [
        "npm install solid-panes@latest",
        "npm install profile-pane@latest"
      ]
    }
  ]
}
```

### Key files modified:
- `scripts/release-orchestrator.js` - Core logic
- `.github/workflows/release.yml` - GitHub Actions workflow
- `RELEASE-HOWTO.md` - Documentation

---

## Known Issues / Limitations

1. **Git credentials in CI:** Currently relies on GITHUB_TOKEN for git operations
2. **npm token permissions:** Requires "Bypass 2FA" for publishing
3. **Single trusted publisher limit:** Cannot use OIDC for central orchestrator
4. **Dependencies not locked:** Resolved for stable mode in orchestrator implementation

---

## Testing Checklist

After implementing dependency locking:

- [ ] Test mode publishes correctly with @test tag
- [ ] Test mode behavior remains as expected for prerelease publishes
- [ ] Stable mode auto-merges dev → main
- [ ] Stable mode updates dependencies to exact versions
- [ ] Stable mode commits with [skip ci]
- [ ] Stable mode publishes with locked dependencies
- [ ] Verify published packages have correct dependency versions on npm
- [ ] Test fallback pattern: `npm install pkg@test || npm install pkg@latest`

---

## Questions for Tomorrow

1. **Artifact upload:** Which option for release-summary.json?
2. **Dependency locking:** Exact pins or caret ranges?
3. **Which dependency fields:** dependencies only, or also devDependencies?
4. **Verification:** Should we add `npm ls` check after afterInstall to log what was installed?

---

## Quick Reference

### Run test publish:
```bash
# From solidos repo
node scripts/release-orchestrator.js \
  --config release.config.json \
  --mode test \
  --dry-run=false \
  --clone-missing=true
```

### Run stable publish:
```bash
node scripts/release-orchestrator.js \
  --config release.config.json \
  --mode stable \
  --dry-run=false \
  --clone-missing=true
```

### Check published versions:
```bash
npm view solid-panes@test
npm view profile-pane@test
npm view mashlib@test
npm dist-tag ls solid-panes
```

---

## Contact / References

- Main repo: https://github.com/solidos/solidos
- Individual repos: SolidOS org
- Documentation: RELEASE-HOWTO.md
- This status: RELEASE-STATUS.md
