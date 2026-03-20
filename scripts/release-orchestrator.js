#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.split('=');
    const cleanKey = key.slice(2);
    if (value !== undefined) {
      args[cleanKey] = value;
    } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args[cleanKey] = argv[i + 1];
      i += 1;
    } else {
      args[cleanKey] = true;
    }
  }
  return args;
}

function sleepMs(ms) {
  const duration = Math.max(0, Number(ms) || 0);
  if (duration === 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, duration);
}

function preferGhToken() {
  if (process.env.GIT_PUSH_TOKEN && !process.env.GH_TOKEN) {
    process.env.GH_TOKEN = process.env.GIT_PUSH_TOKEN;
  }
}

function toBool(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function run(cmd, cwd, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] ${cmd}`);
    return '';
  }
  return execSync(cmd, { cwd, stdio: 'inherit', encoding: 'utf8', shell: true });
}

function runQuiet(cmd, cwd) {
  return execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8', shell: true }).trim();
}

function normalizePathForPack(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function getPackedFilePaths(repoDir) {
  try {
    const output = runQuiet('npm pack --dry-run --json', repoDir);
    const parsed = JSON.parse(output);
    const files = Array.isArray(parsed) && parsed[0] && Array.isArray(parsed[0].files)
      ? parsed[0].files
      : [];
    return files
      .map((file) => normalizePathForPack(file.path))
      .filter(Boolean);
  } catch (err) {
    throw new Error(`Unable to inspect npm pack output: ${err.message}`);
  }
}

function computeMissingArtifacts(pkg, packedPaths) {
  const requiredFiles = [];
  const requiredDirs = [];

  if (pkg && typeof pkg.main === 'string' && pkg.main.trim()) {
    requiredFiles.push(normalizePathForPack(pkg.main));
  }

  if (pkg && typeof pkg.types === 'string' && pkg.types.trim()) {
    requiredFiles.push(normalizePathForPack(pkg.types));
  }

  if (pkg && Array.isArray(pkg.files)) {
    for (const entry of pkg.files) {
      if (typeof entry !== 'string') continue;
      const normalized = normalizePathForPack(entry.trim());
      if (!normalized) continue;
      if (normalized.endsWith('/')) {
        requiredDirs.push(normalized);
      }
    }
  }

  const missingFiles = requiredFiles.filter((filePath) => !packedPaths.includes(filePath));
  const missingDirs = requiredDirs.filter((dirPath) => !packedPaths.some((filePath) => filePath.startsWith(dirPath)));

  return {
    missingFiles,
    missingDirs,
    missingList: [
      ...missingFiles,
      ...missingDirs.map((dirPath) => `${dirPath}*`)
    ]
  };
}

function ensurePublishableArtifacts(repoDir, dryRun, buildCmd = 'npm run build') {
  if (dryRun) return;

  const pkg = getPackageJson(repoDir);
  if (!pkg) return;

  const checkMissing = () => {
    const packedPaths = getPackedFilePaths(repoDir);
    return computeMissingArtifacts(pkg, packedPaths);
  };

  let missing = checkMissing();
  if (missing.missingList.length === 0) return;

  if (!hasScript(pkg, 'build')) {
    throw new Error(`Missing publish artifacts (${missing.missingList.join(', ')}) and no build script is available.`);
  }

  console.log(`Missing publish artifacts: ${missing.missingList.join(', ')}. Running build before publish...`);
  run(buildCmd, repoDir, dryRun);

  missing = checkMissing();
  if (missing.missingList.length > 0) {
    throw new Error(`Publish aborted: package still missing required artifacts after build (${missing.missingList.join(', ')}).`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getPackageJson(repoDir) {
  const pkgPath = path.join(repoDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  return readJson(pkgPath);
}

function getPackageVersion(repoDir) {
  const pkg = getPackageJson(repoDir);
  return pkg ? pkg.version : null;
}

function getModeConfig(config, modeName) {
  if (!config || !config.modes) return {};
  if (Array.isArray(config.modes)) {
    return config.modes.find((m) => m && m.name === modeName) || {};
  }
  return config.modes[modeName] || {};
}

function getModeBranch(config, modeName, fallback = null) {
  const modeConfig = getModeConfig(config, modeName);
  if (modeConfig && modeConfig.branch) return modeConfig.branch;
  return fallback;
}

function remoteBranchExists(repoDir, branch) {
  if (!branch) return false;
  try {
    const result = runQuiet(`git ls-remote --heads origin ${branch}`, repoDir);
    return Boolean(result);
  } catch (err) {
    return false;
  }
}

function getReleaseSourceBranch(repoDir, repo, config, targetBranch, dryRun) {
  const stablePublishConfig = getModeConfig(config, 'stable-publish');
  const stableConfig = getModeConfig(config, 'stable');
  const configuredSourceBranch =
    repo.releaseSourceBranch ||
    repo.sourceBranch ||
    stablePublishConfig.sourceBranch ||
    stableConfig.sourceBranch ||
    config.releaseSourceBranch ||
    getModeBranch(config, 'test', null);

  if (dryRun) {
    return configuredSourceBranch || targetBranch;
  }

  if (configuredSourceBranch && remoteBranchExists(repoDir, configuredSourceBranch)) {
    return configuredSourceBranch;
  }

  if (configuredSourceBranch && configuredSourceBranch !== targetBranch) {
    console.log(`Warning: Release source branch '${configuredSourceBranch}' not found on origin. Falling back to '${targetBranch}'.`);
  }

  return targetBranch;
}

function hasScript(pkg, scriptName) {
  return !!(pkg && pkg.scripts && pkg.scripts[scriptName]);
}

function ensureClean(repoDir, dryRun) {
  const status = runQuiet('git status --porcelain', repoDir);
  if (status) {
    const message = 'Working tree not clean. Commit or stash changes first.';
    if (dryRun) {
      console.log(`[WARNING] ${message}`);
      console.log('Continuing because this is a dry-run...');
    } else {
      throw new Error(message);
    }
  }
}

function ensureBranch(repoDir, branch, dryRun) {
  // Fetch all remote branches
  run(`git fetch --all`, repoDir, dryRun);
  
  // Only verify branch exists if not dry-run (actual fetch happened)
  if (!dryRun) {
    try {
      runQuiet(`git rev-parse --verify origin/${branch}`, repoDir);
    } catch (err) {
      throw new Error(`Branch '${branch}' does not exist on origin.`);
    }
  }
  
  // Switch to branch (creates local tracking branch if needed)
  run(`git switch ${branch} 2>/dev/null || git switch -c ${branch} origin/${branch}`, repoDir, dryRun);
  run(`git pull --ff-only origin ${branch}`, repoDir, dryRun);
}

function ensureCiGitSetup(repoDir, dryRun) {
  if (process.env.GITHUB_ACTIONS !== 'true') return;

  if (!dryRun) {
    const currentName = runQuiet('git config --get user.name || true', repoDir);
    const currentEmail = runQuiet('git config --get user.email || true', repoDir);

    if (!currentName) {
      run('git config user.name "github-actions[bot]"', repoDir, dryRun);
    }
    if (!currentEmail) {
      run('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', repoDir, dryRun);
    }
  }

  const token = process.env.GIT_PUSH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) return;

  const remoteUrl = runQuiet('git remote get-url origin', repoDir);
  if (!remoteUrl || remoteUrl.includes('x-access-token:')) return;

  const match = remoteUrl.match(/^https:\/\/github\.com\/(.+)$/i);
  if (!match || !match[1]) return;

  const authenticatedUrl = `https://x-access-token:${token}@github.com/${match[1]}`;
  run(`git remote set-url origin "${authenticatedUrl}"`, repoDir, dryRun);
}

function withCiGitAuth(url) {
  const raw = String(url || '').trim();
  if (!raw) return raw;
  if (process.env.GITHUB_ACTIONS !== 'true') return raw;

  const token = process.env.GIT_PUSH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) return raw;

  const match = raw.match(/^https:\/\/github\.com\/(.+)$/i);
  if (!match || !match[1]) return raw;
  if (raw.includes('x-access-token:')) return raw;

  return `https://x-access-token:${token}@github.com/${match[1]}`;
}

function parseGitHubRepoSlug(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  const withoutSuffix = raw.replace(/\.git$/i, '');
  const match = withoutSuffix.match(/github\.com[:/]([^/]+\/[^/]+)$/i);
  return match && match[1] ? match[1] : null;
}

function buildReleaseBranchName(repoName) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12);
  const sanitized = String(repoName || 'repo').toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  return `release/${sanitized}-${stamp}`;
}

function maybeCreatePullRequest(repoDir, repo, baseBranch, headBranch, dryRun, options = {}) {
  const slug = parseGitHubRepoSlug(repo.repo || runQuiet('git remote get-url origin', repoDir));
  const title = `Release: merge ${headBranch} into ${baseBranch}`;
  const body = 'Automated stable release preparation.';
  const required = toBool(options.required, false);

  if (dryRun) {
    console.log(`[dry-run] Would create PR for ${slug || repo.name}: ${headBranch} -> ${baseBranch}`);
    return { status: 'dry-run' };
  }

  try {
    runQuiet('gh --version', repoDir);
  } catch (err) {
    if (required) {
      throw new Error('gh CLI not available in runner. Cannot create required release PR.');
    }
    console.log('gh CLI not available in runner. Skipping automatic PR creation.');
    return { status: 'skipped', reason: 'no-gh-cli' };
  }

  try {
    const repoArg = slug ? `--repo ${slug}` : '';
    run(`gh pr create ${repoArg} --base ${baseBranch} --head ${headBranch} --title "${title}" --body "${body}"`.trim(), repoDir, dryRun);
    return { status: 'created' };
  } catch (err) {
    if (required) {
      throw new Error(
        `PR create failed for ${repo.name}: ${err.message}. ` +
        'Ensure GH_TOKEN/GIT_PUSH_TOKEN has access to target repo and Pull requests: Read and write permission.'
      );
    }
    console.log(`PR create skipped for ${repo.name}: ${err.message}`);
    return { status: 'skipped', reason: 'create-failed' };
  }
}

function createReleaseBranch(repoDir, repo, baseBranch, dryRun) {
  const releaseBranch = buildReleaseBranchName(repo.name);
  ensureCiPushAccess(repoDir, releaseBranch, dryRun, { gitPush: true });
  run(`git switch -c ${releaseBranch}`, repoDir, dryRun);
  return releaseBranch;
}

function prepareStablePullRequest(repoDir, repo, config, branch, dryRun, branchOverride) {
  const skipIfNoDiff = repo.skipIfNoDiff ?? config.skipIfNoDiff ?? true;
  const shouldCheckDiff = !dryRun && skipIfNoDiff && !branchOverride;
  const sourceBranch = getReleaseSourceBranch(repoDir, repo, config, branch, dryRun);

  if (sourceBranch === branch) {
    return {
      status: dryRun ? 'dry-run' : 'skipped',
      reason: dryRun ? null : 'source-equals-target',
      releaseBranch: null,
      sourceBranch,
      targetBranch: branch
    };
  }

  try {
    runQuiet(`git fetch origin ${sourceBranch}:refs/remotes/origin/${sourceBranch}`, repoDir);
  } catch (err) {
    console.log(`Warning: Could not fetch ${sourceBranch}: ${err.message}`);
  }

  const commitsAhead = parseInt(runQuiet(`git rev-list --count ${branch}..origin/${sourceBranch}`, repoDir)) || 0;
  if (shouldCheckDiff && commitsAhead === 0) {
    return { status: 'skipped', reason: 'no-diff' };
  }

  const releaseBranch = buildReleaseBranchName(repo.name);
  ensureCiPushAccess(repoDir, releaseBranch, dryRun, { gitPush: true });
  run(`git switch -c ${releaseBranch}`, repoDir, dryRun);
  run(`git merge origin/${sourceBranch} -m "Merge ${sourceBranch} into ${branch} for release [skip ci]"`, repoDir, dryRun);
  run(`git push -u origin ${releaseBranch}`, repoDir, dryRun);
  maybeCreatePullRequest(repoDir, repo, branch, releaseBranch, dryRun);

  return {
    status: dryRun ? 'dry-run' : 'prepared-pr',
    releaseBranch,
    sourceBranch,
    targetBranch: branch
  };
}

function ensureMainContainsStableChanges(repoDir, config, branch, dryRun) {
  if (dryRun) return;
  const sourceBranch = getReleaseSourceBranch(repoDir, {}, config, branch, dryRun);
  if (sourceBranch === branch) return;
  try {
    runQuiet(`git fetch origin ${sourceBranch}:refs/remotes/origin/${sourceBranch}`, repoDir);
    const commitsAhead = parseInt(runQuiet(`git rev-list --count ${branch}..origin/${sourceBranch}`, repoDir)) || 0;
    if (commitsAhead > 0) {
      throw new Error(
        `${commitsAhead} commit(s) still in ${sourceBranch} but not in ${branch}. ` +
        'Merge the release PR into main before running mode=stable-publish.'
      );
    }
  } catch (err) {
    if (err.message.includes('Merge the release PR')) {
      throw err;
    }
    console.log(`Warning: Could not validate ${sourceBranch} vs ${branch}: ${err.message}`);
  }
}

function waitForPRMerge(repoDir, repo, headBranch, baseBranch, dryRun, options = {}) {
  const required = toBool(options.required, false);
  if (dryRun) {
    console.log(`[dry-run] Would wait for and merge PR: ${headBranch} -> ${baseBranch}`);
    return { status: 'dry-run', prNumber: null };
  }

  const slug = parseGitHubRepoSlug(repo.repo || runQuiet('git remote get-url origin', repoDir));
  if (!slug) {
    if (required) {
      throw new Error('Could not determine GitHub repo slug. Cannot merge required release PR.');
    }
    console.log('Warning: Could not determine GitHub repo slug. Skipping PR merge.');
    return { status: 'skip', reason: 'no-slug' };
  }

  try {
    runQuiet('gh --version', repoDir);
  } catch (err) {
    if (required) {
      throw new Error('gh CLI not available in runner. Cannot merge required release PR.');
    }
    console.log('gh CLI not available in runner. Skipping automatic PR merge.');
    return { status: 'skip', reason: 'no-gh-cli' };
  }

  try {
    // Find the PR number for this head branch
    const prQuery = `gh pr list --repo ${slug} --head ${headBranch} --base ${baseBranch} --state open --json number --jq '.[0].number'`;
    let prNumber;
    try {
      prNumber = parseInt(runQuiet(prQuery, repoDir), 10);
    } catch (err) {
      if (required) {
        throw new Error(`No open PR found for ${headBranch} -> ${baseBranch}`);
      }
      console.log(`No open PR found for ${headBranch} -> ${baseBranch}`);
      return { status: 'skip', reason: 'no-pr' };
    }

    if (!prNumber) {
      if (required) {
        throw new Error(`No open PR found for ${headBranch} -> ${baseBranch}`);
      }
      console.log(`No open PR found for ${headBranch} -> ${baseBranch}`);
      return { status: 'skip', reason: 'no-pr' };
    }

    console.log(`Found PR #${prNumber}. Requesting auto-merge...`);
    let autoMergeRequested = false;
    try {
      run(`gh pr merge ${prNumber} --repo ${slug} --merge --auto --delete-branch`.trim(), repoDir, dryRun);
      autoMergeRequested = true;
    } catch (err) {
      const message = String(err.message || err);
      // Some repos reject auto-merge requests while checks are still being initialized.
      if (
        /Repository rule violations found/i.test(message) ||
        /required status checks are expected/i.test(message) ||
        /required status check/i.test(message)
      ) {
        console.log(`  Auto-merge not accepted yet: ${message.split('\n')[0]}`);
      } else {
        throw err;
      }
    }

    const maxWaitTime = 20 * 60 * 1000;
    const pollInterval = 15 * 1000;
    const startTime = Date.now();
    let finalMergedAt = '';
    let sawAnyChecks = false;

    const isTransientRuleViolation = (err) => {
      const text = [
        String(err && err.message ? err.message : ''),
        String(err && err.stderr ? err.stderr : ''),
        String(err && err.stdout ? err.stdout : '')
      ].join('\n');
      return (
        /Repository rule violations found/i.test(text) ||
        /required status checks are expected/i.test(text) ||
        /required status check/i.test(text)
      );
    };

    while ((Date.now() - startTime) < maxWaitTime) {
      let payload;
      try {
        const query = `gh pr view ${prNumber} --repo ${slug} --json state,mergedAt,mergeStateStatus,reviewDecision,statusCheckRollup`;
        payload = JSON.parse(runQuiet(query, repoDir) || '{}');
      } catch (err) {
        console.log(`  Warning reading PR state: ${err.message}`);
        sleepMs(pollInterval);
        continue;
      }

      const state = payload.state || 'UNKNOWN';
      const mergedAt = payload.mergedAt || '';
      const mergeStateStatus = payload.mergeStateStatus || 'UNKNOWN';
      const reviewDecision = payload.reviewDecision || 'UNKNOWN';
      const checks = Array.isArray(payload.statusCheckRollup) ? payload.statusCheckRollup : [];
      if (checks.length > 0) {
        sawAnyChecks = true;
      }

      const pendingChecks = checks.filter((c) => {
        const s = String((c && c.status) || '').toUpperCase();
        return s === 'PENDING' || s === 'IN_PROGRESS' || s === 'QUEUED' || s === 'EXPECTED';
      }).length;

      const failingChecks = checks.filter((c) => {
        const conclusion = String((c && c.conclusion) || '').toUpperCase();
        return conclusion === 'FAILURE' || conclusion === 'TIMED_OUT' || conclusion === 'CANCELLED' || conclusion === 'ACTION_REQUIRED';
      }).length;

      console.log(
        `  PR #${prNumber}: state=${state}, mergeState=${mergeStateStatus}, review=${reviewDecision}, pendingChecks=${pendingChecks}, failingChecks=${failingChecks}`
      );

      if (mergedAt) {
        finalMergedAt = mergedAt;
        break;
      }

      if (state === 'CLOSED') {
        throw new Error(`PR #${prNumber} was closed without merge.`);
      }

      if (failingChecks > 0) {
        throw new Error(`PR #${prNumber} has failing required checks.`);
      }

      // Retry requesting auto-merge once checks have started appearing.
      if (!autoMergeRequested && (pendingChecks > 0 || sawAnyChecks)) {
        try {
          run(`gh pr merge ${prNumber} --repo ${slug} --merge --auto --delete-branch`.trim(), repoDir, dryRun);
          autoMergeRequested = true;
          console.log(`  Auto-merge request accepted for PR #${prNumber}.`);
        } catch (err) {
          console.log(`  Auto-merge still blocked: ${String((err && err.message) || err).split('\n')[0]}`);
        }
      }

      // If checks have materialized and everything is green but merge is still blocked
      // (e.g. review requirement), try admin merge. Do not do this before checks exist.
      if (sawAnyChecks && checks.length > 0 && pendingChecks === 0 && mergeStateStatus === 'BLOCKED') {
        try {
          run(`gh pr merge ${prNumber} --repo ${slug} --merge --admin --delete-branch`.trim(), repoDir, dryRun);
        } catch (err) {
          if (!isTransientRuleViolation(err)) {
            throw err;
          }
          console.log('  Admin merge blocked while checks/rules are still settling; will retry.');
        }
      }

      sleepMs(pollInterval);
    }

    if (!finalMergedAt) {
      finalMergedAt = runQuiet(`gh pr view ${prNumber} --repo ${slug} --json mergedAt --jq '.mergedAt // ""'`, repoDir).trim();
    }

    if (!finalMergedAt) {
      throw new Error(`Timed out waiting for PR #${prNumber} to merge.`);
    }

    console.log(`PR #${prNumber} merged at ${finalMergedAt}.`);

    // Fetch the updated main branch
    run(`git fetch origin ${baseBranch}`, repoDir, dryRun);
    run(`git checkout ${baseBranch}`, repoDir, dryRun);
    run(`git pull origin ${baseBranch}`, repoDir, dryRun);

    return { status: 'merged', prNumber };
  } catch (err) {
    console.error(`Error during PR merge: ${err.message}`);
    throw err;
  }
}

function ensureCiPushAccess(repoDir, branch, dryRun, modeConfig = {}) {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  if (dryRun) return;
  if (modeConfig.gitPush === false) return;

  const tokenSource = process.env.GIT_PUSH_TOKEN ? 'GIT_PUSH_TOKEN' : (process.env.GITHUB_TOKEN ? 'GITHUB_TOKEN' : null);
  if (!tokenSource) {
    throw new Error(`No git push token available for ${repoDir}. Configure GIT_PUSH_TOKEN or GITHUB_TOKEN in CI.`);
  }

  try {
    runQuiet(`git push --dry-run origin HEAD:${branch}`, repoDir);
  } catch (err) {
    throw new Error(
      `Push access check failed for branch '${branch}'. ` +
      `The CI job is authenticated with ${tokenSource}, but that token cannot push to this repository/branch. ` +
      `Use a fine-grained PAT in GIT_PUSH_TOKEN with Contents: Read and write on the target SolidOS repos, ` +
      `and ensure branch protection allows that token/account to push.`
    );
  }
}

function getAheadBehind(repoDir, branch) {
  const raw = runQuiet(`git rev-list --left-right --count origin/${branch}...HEAD`, repoDir);
  const [behind, ahead] = raw.split('\t').map(Number);
  return { behind, ahead };
}

function runSteps(steps, repoDir, dryRun, tag = null) {
  if (!steps || !Array.isArray(steps)) return;
  for (let cmd of steps) {
    // Inject npm tag into npm install commands if tag is provided
    if (tag && cmd.startsWith('npm install')) {
      cmd = parseNpmInstallCmd(cmd, tag);
    }
    run(cmd, repoDir, dryRun);
  }
}

function extractNpmInstallPackages(cmd) {
  const parts = String(cmd || '').trim().split(/\s+/);
  if (parts.length < 3 || parts[0] !== 'npm' || parts[1] !== 'install') {
    return [];
  }

  const packages = [];
  let skipNext = false;
  const flagsWithValues = new Set([
    '--tag', '--registry', '--workspace', '--workspaces', '--save-prefix',
    '--fetch-retries', '--fetch-retry-factor', '--fetch-retry-mintimeout',
    '--fetch-retry-maxtimeout', '--prefer-dedupe', '--omit', '--include',
    '-w'
  ]);

  for (let i = 2; i < parts.length; i += 1) {
    const part = parts[i];
    if (!part) continue;

    if (skipNext) {
      skipNext = false;
      continue;
    }

    if (part.startsWith('-')) {
      if (!part.includes('=') && flagsWithValues.has(part)) {
        skipNext = true;
      }
      continue;
    }

    if (
      part.startsWith('.') || part.startsWith('/') || part.startsWith('file:') ||
      part.startsWith('git+') || part.startsWith('http://') || part.startsWith('https://')
    ) {
      continue;
    }

    const parsed = parseNpmPackageSpecifier(part);
    if (parsed && parsed.name) {
      packages.push(parsed.name);
    }
  }

  return packages;
}

function parseNpmPackageSpecifier(spec) {
  const value = String(spec || '').trim();
  if (!value) return null;

  if (value.startsWith('@')) {
    const slashIndex = value.indexOf('/');
    if (slashIndex === -1) return null;
    const versionSep = value.lastIndexOf('@');
    if (versionSep > slashIndex) {
      return { name: value.slice(0, versionSep), requested: value.slice(versionSep + 1) };
    }
    return { name: value, requested: null };
  }

  const versionSep = value.indexOf('@');
  if (versionSep > 0) {
    return { name: value.slice(0, versionSep), requested: value.slice(versionSep + 1) };
  }

  return { name: value, requested: null };
}

function getInstalledPackageVersion(repoDir, packageName) {
  const modulePath = path.join(repoDir, 'node_modules', ...packageName.split('/'), 'package.json');
  if (!fs.existsSync(modulePath)) return null;

  try {
    const pkg = readJson(modulePath);
    return pkg && pkg.version ? String(pkg.version) : null;
  } catch (err) {
    return null;
  }
}

function buildLockedVersion(installedVersion, prefix) {
  const normalizedPrefix = prefix === undefined || prefix === null ? '' : String(prefix);
  return `${normalizedPrefix}${installedVersion}`;
}

function lockStableDependencyVersions(repoDir, repo, config, modeConfig, dryRun) {
  const npmTag = modeConfig.npmTag || 'latest';
  const commands = Array.isArray(repo.afterInstall) ? repo.afterInstall : [];
  const packageNames = new Set();

  for (const rawCmd of commands) {
    const installCmd = parseNpmInstallCmd(rawCmd, npmTag);
    const firstSegment = installCmd.split('||')[0].trim();
    const parsedPackages = extractNpmInstallPackages(firstSegment);
    for (const pkgName of parsedPackages) {
      packageNames.add(pkgName);
    }
  }

  if (packageNames.size === 0) {
    return;
  }

  const pkgPath = path.join(repoDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return;
  }

  const lockFields = modeConfig.lockDependencyFields || config.lockDependencyFields || ['dependencies', 'devDependencies'];
  const versionPrefix = modeConfig.lockDependencyPrefix ?? config.lockDependencyPrefix ?? '';
  const packageJson = readJson(pkgPath);
  let changed = false;

  for (const packageName of packageNames) {
    const installedVersion = getInstalledPackageVersion(repoDir, packageName);
    if (!installedVersion) {
      console.log(`Warning: Could not resolve installed version for ${packageName}; skipping lock update.`);
      continue;
    }

    const lockedVersion = buildLockedVersion(installedVersion, versionPrefix);
    for (const field of lockFields) {
      if (!packageJson[field] || typeof packageJson[field] !== 'object') continue;
      if (!Object.prototype.hasOwnProperty.call(packageJson[field], packageName)) continue;

      if (packageJson[field][packageName] !== lockedVersion) {
        console.log(`Locking ${field}.${packageName}: ${packageJson[field][packageName]} -> ${lockedVersion}`);
        packageJson[field][packageName] = lockedVersion;
        changed = true;
      }
    }
  }

  if (!changed) {
    return;
  }

  if (dryRun) {
    console.log('[dry-run] Would update package.json dependency versions from installed packages.');
    return;
  }

  fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2) + '\n');

  // Refresh lockfile(s) after pinning dependencies.
  const lockInstallCmd = modeConfig.lockInstallCommand || config.lockInstallCommand || 'npm install';
  run(lockInstallCmd, repoDir, dryRun);

  const filesToStage = ['package.json', 'package-lock.json', 'npm-shrinkwrap.json']
    .filter((fileName) => fs.existsSync(path.join(repoDir, fileName)));

  if (filesToStage.length === 0) {
    return;
  }

  run(`git add ${filesToStage.join(' ')}`, repoDir, dryRun);
  const stagedStatus = runQuiet('git diff --cached --name-only', repoDir);
  if (!stagedStatus) {
    return;
  }

  const commitMessage = modeConfig.lockCommitMessage || 'chore(release): lock tested dependency versions [skip ci]';
  run(`git commit -m "${commitMessage}"`, repoDir, dryRun);
}

function parseNpmInstallCmd(cmd, tag) {
  const parts = cmd.split(/\s+/);
  if (parts[0] !== 'npm' || parts[1] !== 'install') {
    return cmd; // Not an npm install command
  }

  const result = ['npm', 'install'];
  const fallback = ['npm', 'install'];
  
  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];
    
    // Keep flags, option values, and packages with existing tags as-is
    if (part.startsWith('-') || part.startsWith('@') || part.includes('@')) {
      result.push(part);
      fallback.push(part);
    } else if (part === '') {
      // Skip empty strings
      continue;
    } else {
      // This is a package name, add tag
      result.push(`${part}@${tag}`);
      fallback.push(`${part}@latest`);
    }
  }
  
  const mainCmd = result.join(' ');
  
  // For test mode, add fallback to @latest if @test doesn't exist
  if (tag === 'test') {
    const fallbackCmd = fallback.join(' ');
    return `${mainCmd} || ${fallbackCmd}`;
  }
  
  return mainCmd;
}

function packageVersionExists(name, version, repoDir) {
  if (!name || !version) return false;
  try {
    const output = runQuiet(`npm view ${name}@${version} version`, repoDir);
    return output.trim() !== '';
  } catch (err) {
    return false;
  }
}

function waitForNpmVersion(name, version, repoDir, timeoutMs = 60000, pollIntervalMs = 2000) {
  if (!name || !version) return true; // Skip check if no name/version
  
  const startTime = Date.now();
  let pollCount = 0;
  
  while (Date.now() - startTime < timeoutMs) {
    pollCount++;
    if (pollCount > 1) {
      console.log(`  Polling npm registry for ${name}@${version}... (attempt ${pollCount})`);
    }
    
    if (packageVersionExists(name, version, repoDir)) {
      console.log(`✓ ${name}@${version} is now available on npm`);
      return true;
    }
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    if (elapsed < timeoutMs / 1000) {
      console.log(`  Not yet available (${elapsed}s elapsed, waiting ${pollIntervalMs}ms before retry...)`);
      // Sleep before retrying
      const sleepUntil = Date.now() + pollIntervalMs;
      while (Date.now() < sleepUntil) {
        // Busy wait (could use a promise-based sleep, but keeping it simple)
      }
    }
  }
  
  console.warn(`⚠ Timeout waiting for ${name}@${version} to be available on npm (waited ${timeoutMs}ms)`);
  return false;
}

function ensureCleanBeforeVersion(repoDir, dryRun, options = {}) {
  const status = runQuiet('git status --porcelain', repoDir);
  if (!status) return;

  const autoCommit = toBool(options.autoCommit, false);
  const commitMessage = options.commitMessage || 'chore(release): sync release prep changes [skip ci]';
  const preview = status.split('\n').slice(0, 20).join('\n');

  if (dryRun) {
    console.log('[dry-run] Working tree has changes before npm version.');
    console.log(preview);
    return;
  }

  if (!autoCommit) {
    throw new Error(`Working tree not clean before npm version.\n${preview}`);
  }

  console.log('Working tree has release-prep changes. Auto-committing before npm version...');
  run('git add -A', repoDir, dryRun);
  const staged = runQuiet('git diff --cached --name-only', repoDir);
  if (!staged) {
    throw new Error('Working tree had changes but nothing was staged for commit before npm version.');
  }
  run(`git commit -m "${commitMessage}"`, repoDir, dryRun);
}

function bumpStableVersion(repoDir, modeConfig, dryRun) {
  ensureCleanBeforeVersion(repoDir, dryRun, {
    autoCommit: modeConfig.autoCommitBeforeVersion ?? (process.env.GITHUB_ACTIONS === 'true'),
    commitMessage: modeConfig.preVersionCommitMessage || 'chore(release): sync release prep changes [skip ci]'
  });

  const bump = modeConfig.versionBump || 'patch';
  if (modeConfig.gitTag === false) {
    run(`npm version ${bump} --no-git-tag-version --ignore-scripts`, repoDir, dryRun);
  } else {
    run(`npm version ${bump} -m "Release %s" --ignore-scripts`, repoDir, dryRun);
  }

  const pkg = getPackageJson(repoDir);
  return {
    packageName: pkg ? pkg.name : null,
    version: getPackageVersion(repoDir),
    tag: modeConfig.npmTag || 'latest'
  };
}

function publishPreparedStable(repoDir, modeConfig, dryRun, buildCmd) {
  const pkg = getPackageJson(repoDir);
  const packageName = pkg ? pkg.name : null;
  const version = getPackageVersion(repoDir);

  const tag = modeConfig.npmTag && modeConfig.npmTag !== 'latest'
    ? `--tag ${modeConfig.npmTag}`
    : '';
  ensurePublishableArtifacts(repoDir, dryRun, buildCmd);
  console.log(`Publishing ${packageName || 'package'}@${version} with tag ${modeConfig.npmTag || 'latest'}...`);
  run(`npm publish ${tag} --ignore-scripts --no-provenance`.trim(), repoDir, dryRun);

  if (!dryRun && packageName && version) {
    console.log(`Waiting for ${packageName}@${version} to be available on npm...`);
    const registryReady = waitForNpmVersion(packageName, version, repoDir, 120000, 3000);
    if (!registryReady) {
      console.warn(`Warning: ${packageName}@${version} may not be available yet. Dependent packages may fail to install.`);
    }
  }

  if (modeConfig.gitPush !== false && modeConfig.gitTag !== false) {
    const branch = modeConfig.branch || 'main';
    run(`git push origin ${branch} --follow-tags`, repoDir, dryRun);
  }

  return { packageName, version, tag: modeConfig.npmTag || 'latest' };
}

function publishStable(repoDir, modeConfig, dryRun, buildCmd) {
  bumpStableVersion(repoDir, modeConfig, dryRun);
  return publishPreparedStable(repoDir, modeConfig, dryRun, buildCmd);
}

function publishTest(repoDir, modeConfig, dryRun, buildCmd) {
  const preid = modeConfig.preid || 'test';
  const pkg = getPackageJson(repoDir);
  const name = pkg ? pkg.name : null;
  let localVersion = pkg ? pkg.version : null;

  console.log(`Local package.json version: ${localVersion}`);

  // Get the latest @test version from npm FIRST to understand what's already published
  let latestTestVersion = null;
  if (name) {
    try {
      const result = runQuiet(`npm view ${name}@${preid} version`, repoDir);
      if (result && result.trim()) {
        latestTestVersion = result.trim();
        console.log(`Latest published @${preid} version: ${latestTestVersion}`);
      }
    } catch (err) {
      // No @test version published yet, that's fine
      console.log(`No @${preid} version published yet`);
    }
  }

  // Get the latest stable version from npm
  let latestStableVersion = null;
  if (name) {
    try {
      const result = runQuiet(`npm view ${name}@latest version`, repoDir);
      if (result && result.trim()) {
        latestStableVersion = result.trim();
        console.log(`Latest published @latest version: ${latestStableVersion}`);
      }
    } catch (err) {
      console.log(`No @latest version published yet`);
    }
  }

  let version;

  // Strategy: Always compute baseVersion from the latest published @test version first
  // This ensures we're incrementing from what npm sees, not what our local checkout has
  if (latestTestVersion) {
    // Extract the base version and counter from the latest published @test version
    // Match pattern 1: X.Y.Z-preid.N (standard test version with counter)
    // Match pattern 2: X.Y.Z (just a version, no test suffix yet)
    const regexPattern = `^(\\d+\\.\\d+\\.\\d+)(?:.*)?-${preid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.(\\d+)$`;
    console.log(`[DEBUG] Testing regex: ${regexPattern}`);
    console.log(`[DEBUG] Against version: ${latestTestVersion}`);
    const counterMatch = latestTestVersion.match(new RegExp(regexPattern));
    console.log(`[DEBUG] Regex match result:`, counterMatch);
    
    if (counterMatch && counterMatch[1]) {
      // Found a version with -test.N pattern
      const publishedBaseVersion = counterMatch[1];
      const publishedCounter = parseInt(counterMatch[2], 10);
      console.log(`Base version from published @${preid}: ${publishedBaseVersion}, counter: ${publishedCounter}`);
      
      // Check if the base version from @test matches the latest stable
      // If yes, we need to bump to the next patch version for the test
      if (latestStableVersion && publishedBaseVersion === latestStableVersion) {
        console.log(`Base version ${publishedBaseVersion} matches latest stable. Bumping to next patch for test...`);
        // Increment patch version and start at -test.0
        const versionParts = publishedBaseVersion.split('.');
        if (versionParts.length >= 3) {
          versionParts[2] = String(parseInt(versionParts[2], 10) + 1);
          const newBaseVersion = versionParts.join('.');
          version = `${newBaseVersion}-${preid}.0`;
          console.log(`Bumping to ${version}...`);
        } else {
          // Fallback to normal bump if version format is unexpected
          console.log(`Unexpected version format. Doing normal prerelease bump...`);
          run(`npm version prerelease --preid ${preid} --no-git-tag-version --ignore-scripts`, repoDir, dryRun);
          version = getPackageVersion(repoDir);
        }
        
        // Update package.json manually with this version
        if (version && !dryRun) {
          const pkgPath = path.join(repoDir, 'package.json');
          const pkgData = readJson(pkgPath);
          pkgData.version = version;
          fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n');
        }
      } else {
        // Base version doesn't match stable, increment the test counter
        const nextCounter = parseInt(counterMatch[2], 10) + 1;
        version = `${publishedBaseVersion}-${preid}.${nextCounter}`;
        console.log(`Latest @${preid} is ${latestTestVersion}. Incrementing to ${version}...`);

        // Update package.json manually with this version
        const pkgPath = path.join(repoDir, 'package.json');
        const pkgData = readJson(pkgPath);
        pkgData.version = version;
        fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n');
      }
    } else {
      // Couldn't find exact -test.N pattern, but we do have a @test version
      // Extract just the X.Y.Z base from latestTestVersion
      const baseVersionMatch = latestTestVersion.match(/^(\d+\.\d+\.\d+)/);
      if (baseVersionMatch && baseVersionMatch[1]) {
        const publishedBaseVersion = baseVersionMatch[1];
        console.log(`Found @${preid} version but no -${preid}.N pattern. Extracted base: ${publishedBaseVersion}`);
        
        // Check if this base version matches the latest stable
        if (latestStableVersion && publishedBaseVersion === latestStableVersion) {
          console.log(`Base version ${publishedBaseVersion} matches latest stable. Bumping to next patch for test...`);
          const versionParts = publishedBaseVersion.split('.');
          if (versionParts.length >= 3) {
            versionParts[2] = String(parseInt(versionParts[2], 10) + 1);
            const newBaseVersion = versionParts.join('.');
            version = `${newBaseVersion}-${preid}.0`;
            console.log(`Bumping to ${version}...`);
          } else {
            console.log(`Unexpected version format. Doing normal prerelease bump...`);
            run(`npm version prerelease --preid ${preid} --no-git-tag-version --ignore-scripts`, repoDir, dryRun);
            version = getPackageVersion(repoDir);
          }
          
          // Update package.json manually with this version
          if (version && !dryRun) {
            const pkgPath = path.join(repoDir, 'package.json');
            const pkgData = readJson(pkgPath);
            pkgData.version = version;
            fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n');
          }
        } else {
          // Base version doesn't match stable, use this version as starting point for -test
          version = `${publishedBaseVersion}-${preid}.0`;
          console.log(`Base version ${publishedBaseVersion} differs from stable. Starting test version at ${version}...`);
          
          // Update package.json manually with this version
          if (!dryRun) {
            const pkgPath = path.join(repoDir, 'package.json');
            const pkgData = readJson(pkgPath);
            pkgData.version = version;
            fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n');
          }
        }
      } else {
        // Couldn't parse base version at all, do normal prerelease bump
        console.log(`Found @${preid} (${latestTestVersion}) but couldn't parse base version. Doing normal prerelease bump...`);
        run(`npm version prerelease --preid ${preid} --no-git-tag-version --ignore-scripts`, repoDir, dryRun);
        version = getPackageVersion(repoDir);
        if (dryRun) {
          console.log(`[dry-run simulation] Prerelease version would be: ${version}`);
        } else {
          console.log(`After prerelease bump: ${version}`);
        }
      }
    }
  } else {
    // No existing @test version, but we can be smart about versioning
    console.log(`No @${preid} version found. Determining strategy for first test release...`);
    
    // Extract base version from local version (just X.Y.Z, strip any pre-release identifiers)
    const localBaseMatch = localVersion.match(/^(\d+\.\d+\.\d+)/);
    const localBaseVersion = localBaseMatch ? localBaseMatch[1] : localVersion;
    console.log(`Local base version: ${localBaseVersion}`);
    
    if (latestStableVersion && localBaseVersion === latestStableVersion) {
      // Local version base matches latest stable, so bump patch and start at -test.0
      console.log(`Local base ${localBaseVersion} matches latest stable. Bumping to next patch for test...`);
      const versionParts = localBaseVersion.split('.');
      if (versionParts.length >= 3) {
        versionParts[2] = String(parseInt(versionParts[2], 10) + 1);
        const newBaseVersion = versionParts.join('.');
        version = `${newBaseVersion}-${preid}.0`;
        console.log(`Using ${version} for test release...`);
        
        if (!dryRun) {
          const pkgPath = path.join(repoDir, 'package.json');
          const pkgData = readJson(pkgPath);
          pkgData.version = version;
          fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n');
        }
      } else {
        // Fallback to normal prerelease bump if format is unexpected
        console.log(`Unexpected version format. Doing normal prerelease bump...`);
        run(`npm version prerelease --preid ${preid} --no-git-tag-version --ignore-scripts`, repoDir, dryRun);
        version = getPackageVersion(repoDir);
      }
    } else {
      // Local version is newer than stable (or no stable exists), use it with -test.0
      version = `${localBaseVersion}-${preid}.0`;
      console.log(`Local base ${localBaseVersion} is ahead of stable. Starting test at ${version}...`);
      
      if (!dryRun) {
        const pkgPath = path.join(repoDir, 'package.json');
        const pkgData = readJson(pkgPath);
        pkgData.version = version;
        fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n');
      }
    }
    
    if (dryRun) {
      console.log(`[dry-run simulation] Test version would be: ${version}`);
    }
  }

  const tag = modeConfig.npmTag || 'test';
  ensurePublishableArtifacts(repoDir, dryRun, buildCmd);
  console.log(`Publishing ${name || 'package'}@${version} with tag ${tag}...`);
  // Ignore lifecycle scripts to avoid postpublish git pushes in CI.
  run(`npm publish --tag ${tag} --ignore-scripts --no-provenance`, repoDir, dryRun);

  // Wait for the version to be available on npm registry
  if (!dryRun && name && version) {
    console.log(`Waiting for ${name}@${version} to be available on npm...`);
    const registryReady = waitForNpmVersion(name, version, repoDir, 120000, 3000);
    if (!registryReady) {
      console.warn(`Warning: ${name}@${version} may not be available yet. Packages depending on this may fail to install.`);
    }
  }

  console.log('Note: test publish updated package.json/package-lock.json.');
  console.log('      Use git restore to clean if you do not want to keep it.');

  return { packageName: name, version, tag };
}

function main() {
  preferGhToken();
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode || 'stable';
  const configPath = path.resolve(process.cwd(), args.config || 'release.config.json');
  const dryRun = toBool(args['dry-run'], false);
  const cloneMissing = toBool(args['clone-missing'], false);
  const summaryPath = path.resolve(process.cwd(), args['summary-path'] || 'release-summary.json');
  const branchOverride = args.branch; // Command-line branch override
  const isCi = process.env.GITHUB_ACTIONS === 'true';
  const effectiveCloneMissing = isCi ? true : cloneMissing;

  if (!isCi && !dryRun) {
    throw new Error('Publishing is only allowed in GitHub Actions. Use --dry-run locally.');
  }

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found: ${configPath}`);
  }

  const config = readJson(configPath);
  const configDir = path.dirname(configPath);
  const isStablePrepareMode = mode === 'stable-prepare-pr';
  const isStablePublishMode = mode === 'stable-publish';
  const isStableMode = mode === 'stable';
  const modeConfigBase = getModeConfig(config, mode) || {};
  const stableBaseConfig = getModeConfig(config, 'stable') || {};
  const modeConfig = isStablePrepareMode
    ? { ...stableBaseConfig, ...modeConfigBase, gitPush: false, gitTag: false }
    : isStablePublishMode
      ? { ...stableBaseConfig, ...modeConfigBase, gitPush: false, gitTag: false }
      : modeConfigBase;

  if (!config.repos || !Array.isArray(config.repos)) {
    throw new Error('Config must include a repos array.');
  }

  const summary = [];

  for (const repo of config.repos) {
    const repoDir = path.resolve(configDir, repo.path);
    const branch = branchOverride || repo.branch || modeConfig.branch || config.defaultBranch || 'main';
    const effectiveModeConfig = { ...modeConfig, branch };
    let stablePublishReleaseBranch = null;

    console.log(`\n==> ${repo.name} (${repoDir})`);

    if (!fs.existsSync(repoDir)) {
      if (effectiveCloneMissing && repo.repo) {
        const cloneUrl = withCiGitAuth(repo.repo);
        run(`git clone ${cloneUrl} ${repoDir}`, configDir, dryRun);
        // Fetch all branches after cloning (clone only gets default branch)
        run(`git fetch origin`, repoDir, dryRun);
      } else {
        console.log('Skipping: repo directory not found.');
        continue;
      }
    }

    ensureClean(repoDir, dryRun);
    
    try {
      ensureBranch(repoDir, branch, dryRun);
    } catch (err) {
      console.log(`Skipping: ${err.message}`);
      summary.push({
        name: repo.name,
        status: 'skipped',
        reason: 'branch-not-found'
      });
      continue;
    }

    ensureCiGitSetup(repoDir, dryRun);
    if (isStableMode) {
      ensureCiPushAccess(repoDir, branch, dryRun, effectiveModeConfig);
    }

    if (isStablePrepareMode) {
      const prepareResult = prepareStablePullRequest(repoDir, repo, config, branch, dryRun, branchOverride);
      summary.push({
        name: repo.name,
        status: prepareResult.status,
        reason: prepareResult.reason || null,
        releaseBranch: prepareResult.releaseBranch || null,
        sourceBranch: prepareResult.sourceBranch || null,
        targetBranch: prepareResult.targetBranch || null
      });
      continue;
    }

    if (isStablePublishMode) {
      console.log(`Preparing protected-branch release from ${branch} for ${repo.name}...`);
      stablePublishReleaseBranch = createReleaseBranch(repoDir, repo, branch, dryRun);
    }

    // Skip ahead/behind check in dry-run since git commands don't actually execute
    if (!dryRun) {
      const { behind, ahead } = getAheadBehind(repoDir, branch);
      if (behind > 0) {
        throw new Error(`Local branch behind origin/${branch}. Pull first.`);
      }
    }

    const pkg = getPackageJson(repoDir);

    // Run install phase first (may modify files)
    if (repo.install !== false) {
      const installCmd = repo.install || config.defaultInstall || 'npm install';
      runSteps(repo.beforeInstall, repoDir, dryRun);
      run(installCmd, repoDir, dryRun);
      const npmTag = effectiveModeConfig.npmTag || 'latest';
      runSteps(repo.afterInstall, repoDir, dryRun, npmTag);
    }

    // Check for changes AFTER install (only for stable mode)
    // Test mode always publishes
    // Stable mode skips if no diff, unless branch was explicitly specified or dry-run
    let shouldMergeDev = false;
    
    if (isStableMode) {
      const skipIfNoDiff = repo.skipIfNoDiff ?? config.skipIfNoDiff ?? true;
      const shouldCheckDiff = !dryRun && skipIfNoDiff && !branchOverride;
      const sourceBranch = getReleaseSourceBranch(repoDir, repo, config, branch, dryRun);
      
      if (shouldCheckDiff && sourceBranch !== branch) {
        // For stable mode: check if source branch has changes that target doesn't
        
        // Ensure we have latest source refs
        try {
          runQuiet(`git fetch origin ${sourceBranch}:refs/remotes/origin/${sourceBranch}`, repoDir);
        } catch (err) {
          console.log(`Warning: Could not fetch ${sourceBranch}: ${err.message}`);
        }
        
        // Count commits that source has but target doesn't
        const commitsAhead = parseInt(runQuiet(`git rev-list --count ${branch}..origin/${sourceBranch}`, repoDir)) || 0;
        
        if (commitsAhead === 0) {
          console.log(`No changes in origin/${sourceBranch} vs ${branch}. Skipping publish.`);
          summary.push({
            name: repo.name,
            status: 'skipped',
            reason: 'no-diff'
          });
          continue;
        } else {
          console.log(`Found ${commitsAhead} commit(s) in ${sourceBranch} not in ${branch}. Will merge and publish.`);
          shouldMergeDev = true;
        }
      }
    }
    
    // For stable mode: check if we need to merge dev (even if skipIfNoDiff is disabled)
    if (isStableMode && !shouldMergeDev) {
      const sourceBranch = getReleaseSourceBranch(repoDir, repo, config, branch, dryRun);
      if (sourceBranch === branch) {
        shouldMergeDev = false;
      } else {
      
      try {
        runQuiet(`git fetch origin ${sourceBranch}:refs/remotes/origin/${sourceBranch}`, repoDir);
        const commitsAhead = parseInt(runQuiet(`git rev-list --count ${branch}..origin/${sourceBranch}`, repoDir)) || 0;
        
        if (commitsAhead > 0) {
          console.log(`Found ${commitsAhead} commit(s) in ${sourceBranch} not in ${branch}. Will merge before publish.`);
          shouldMergeDev = true;
        }
      } catch (err) {
        console.log(`Warning: Could not check ${sourceBranch}: ${err.message}`);
      }
      }
    }
    
    // Merge dev into main before publishing (stable mode only)
    if (isStableMode && shouldMergeDev) {
      const sourceBranch = getReleaseSourceBranch(repoDir, repo, config, branch, dryRun);
      console.log(`Merging origin/${sourceBranch} into ${branch}...`);
      try {
        run(`git merge origin/${sourceBranch} -m "Merge ${sourceBranch} into ${branch} for release [skip ci]"`, repoDir, dryRun);
      } catch (err) {
        throw new Error(`Failed to merge origin/${sourceBranch} into ${branch}. Please resolve conflicts manually.`);
      }
    }

    // Stable mode: lock dependency versions based on what afterInstall actually installed.
    if (isStableMode || isStablePublishMode) {
      lockStableDependencyVersions(repoDir, repo, config, effectiveModeConfig, dryRun);
    }

    if (repo.test !== false) {
      const testCmd = repo.test || config.defaultTest || 'npm test';
      runSteps(repo.beforeTest, repoDir, dryRun);
      if (hasScript(pkg, 'test') || repo.test) {
        run(testCmd, repoDir, dryRun);
      } else {
        console.log('No test script found. Skipping tests.');
      }
      runSteps(repo.afterTest, repoDir, dryRun);
    }

    const effectiveBuildCmd = repo.build || config.defaultBuild || 'npm run build';

    if (repo.build !== false) {
      runSteps(repo.beforeBuild, repoDir, dryRun);
      if (hasScript(pkg, 'build') || repo.build) {
        run(effectiveBuildCmd, repoDir, dryRun);
      } else {
        console.log('No build script found. Skipping build.');
      }
      runSteps(repo.afterBuild, repoDir, dryRun);
    }

    runSteps(repo.beforePublish, repoDir, dryRun);

    if (mode === 'test') {
      const result = publishTest(repoDir, effectiveModeConfig, dryRun, effectiveBuildCmd);
      summary.push({
        name: repo.name,
        status: dryRun ? 'dry-run' : 'published',
        packageName: result.packageName || null,
        version: result.version,
        tag: result.tag,
        publishedAs: result.packageName ? `${result.packageName}@${result.version}` : null
      });
    } else if (isStablePublishMode) {
      bumpStableVersion(repoDir, effectiveModeConfig, dryRun);

      console.log(`Step 1/3: Creating release PR from ${stablePublishReleaseBranch} -> ${branch}...`);
      run(`git push -u origin ${stablePublishReleaseBranch}`, repoDir, dryRun);
      maybeCreatePullRequest(repoDir, repo, branch, stablePublishReleaseBranch, dryRun, { required: true });

      console.log('Step 2/3: Auto-merging release PR...');
      waitForPRMerge(repoDir, repo, stablePublishReleaseBranch, branch, dryRun, { required: true });

      ensureBranch(repoDir, branch, dryRun);

      console.log('Step 3/3: Publishing packages from merged branch...');
      const result = publishPreparedStable(repoDir, effectiveModeConfig, dryRun, effectiveBuildCmd);
      summary.push({
        name: repo.name,
        status: dryRun ? 'dry-run' : 'published',
        packageName: result.packageName || null,
        version: result.version,
        tag: result.tag,
        publishedAs: result.packageName ? `${result.packageName}@${result.version}` : null
      });
    } else if (isStableMode) {
      const result = publishStable(repoDir, effectiveModeConfig, dryRun, effectiveBuildCmd);
      summary.push({
        name: repo.name,
        status: dryRun ? 'dry-run' : 'published',
        packageName: result.packageName || null,
        version: result.version,
        tag: result.tag,
        publishedAs: result.packageName ? `${result.packageName}@${result.version}` : null
      });
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }

    runSteps(repo.afterPublish, repoDir, dryRun);
  }

  console.log('\nRelease summary:');
  for (const item of summary) {
    if (item.status === 'published' || item.status === 'dry-run') {
      console.log(`- ${item.name}: ${item.status} ${item.version || ''} (${item.tag || 'latest'})`.trim());
    } else {
      console.log(`- ${item.name}: ${item.status} (${item.reason})`);
    }
  }

  const summaryPayload = {
    mode,
    dryRun,
    generatedAt: new Date().toISOString(),
    items: summary
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summaryPayload, null, 2));
  console.log(`Summary written to ${summaryPath}`);
}

try {
  main();
} catch (err) {
  console.error(`Release failed: ${err.message}`);
  process.exit(1);
}
