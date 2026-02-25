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

function disableVersionScripts(repoDir) {
  const pkgPath = path.join(repoDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = readJson(pkgPath);
  if (!pkg.scripts) return null;

  const original = { ...pkg.scripts };
  const updated = { ...pkg.scripts };
  let changed = false;

  for (const key of Object.keys(updated)) {
    if (key === 'preversion' || key === 'postversion' || key === 'version') {
      updated[`ignore:${key}`] = updated[key];
      delete updated[key];
      changed = true;
    }
  }

  if (!changed) return null;

  pkg.scripts = updated;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  return original;
}

function restoreVersionScripts(repoDir, originalScripts) {
  if (!originalScripts) return;
  const pkgPath = path.join(repoDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return;
  const pkg = readJson(pkgPath);
  pkg.scripts = originalScripts;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
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

function publishStable(repoDir, modeConfig, dryRun) {
  const bump = modeConfig.versionBump || 'patch';
  const originalScripts = disableVersionScripts(repoDir);
  try {
    if (modeConfig.gitTag === false) {
      run(`npm version ${bump} --no-git-tag-version`, repoDir, dryRun);
    } else {
      run(`npm version ${bump} -m "Release %s"`, repoDir, dryRun);
    }
  } finally {
    restoreVersionScripts(repoDir, originalScripts);
  }

  const pkg = getPackageJson(repoDir);
  const packageName = pkg ? pkg.name : null;
  const version = getPackageVersion(repoDir);

  const tag = modeConfig.npmTag && modeConfig.npmTag !== 'latest'
    ? `--tag ${modeConfig.npmTag}`
    : '';
  // Ignore lifecycle scripts to avoid postpublish git pushes in CI.
  console.log(`Publishing ${packageName || 'package'}@${version} with tag ${modeConfig.npmTag || 'latest'}...`);
  run(`npm publish ${tag} --ignore-scripts --no-provenance`.trim(), repoDir, dryRun);

  if (modeConfig.gitPush !== false && modeConfig.gitTag !== false) {
    const branch = modeConfig.branch || 'main';
    run(`git push origin ${branch} --follow-tags`, repoDir, dryRun);
  }

  return { packageName, version, tag: modeConfig.npmTag || 'latest' };
}

function publishTest(repoDir, modeConfig, dryRun) {
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
          const originalScripts = disableVersionScripts(repoDir);
          try {
            run(`npm version prerelease --preid ${preid} --no-git-tag-version`, repoDir, dryRun);
          } finally {
            restoreVersionScripts(repoDir, originalScripts);
          }
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
            const originalScripts = disableVersionScripts(repoDir);
            try {
              run(`npm version prerelease --preid ${preid} --no-git-tag-version`, repoDir, dryRun);
            } finally {
              restoreVersionScripts(repoDir, originalScripts);
            }
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
        const originalScripts = disableVersionScripts(repoDir);
        try {
          run(`npm version prerelease --preid ${preid} --no-git-tag-version`, repoDir, dryRun);
        } finally {
          restoreVersionScripts(repoDir, originalScripts);
        }
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
        const originalScripts = disableVersionScripts(repoDir);
        try {
          run(`npm version prerelease --preid ${preid} --no-git-tag-version`, repoDir, dryRun);
        } finally {
          restoreVersionScripts(repoDir, originalScripts);
        }
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
  console.log(`Publishing ${name || 'package'}@${version} with tag ${tag}...`);
  // Ignore lifecycle scripts to avoid postpublish git pushes in CI.
  run(`npm publish --tag ${tag} --ignore-scripts --no-provenance`, repoDir, dryRun);

  console.log('Note: test publish updated package.json/package-lock.json.');
  console.log('      Use git restore to clean if you do not want to keep it.');

  return { packageName: name, version, tag };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode || 'stable';
  const configPath = path.resolve(process.cwd(), args.config || 'release.config.json');
  const dryRun = toBool(args['dry-run'], false);
  const cloneMissing = toBool(args['clone-missing'], false);
  const summaryPath = path.resolve(process.cwd(), args['summary-path'] || 'release-summary.json');
  const branchOverride = args.branch; // Command-line branch override
  const isCi = process.env.GITHUB_ACTIONS === 'true';

  if (!isCi && !dryRun) {
    throw new Error('Publishing is only allowed in GitHub Actions. Use --dry-run locally.');
  }

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found: ${configPath}`);
  }

  const config = readJson(configPath);
  const configDir = path.dirname(configPath);
  const modeConfig = (config.modes && config.modes[mode]) || {};

  if (!config.repos || !Array.isArray(config.repos)) {
    throw new Error('Config must include a repos array.');
  }

  const summary = [];

  for (const repo of config.repos) {
    const repoDir = path.resolve(configDir, repo.path);
    const branch = branchOverride || repo.branch || modeConfig.branch || config.defaultBranch || 'main';
    const effectiveModeConfig = { ...modeConfig, branch };

    console.log(`\n==> ${repo.name} (${repoDir})`);

    if (!fs.existsSync(repoDir)) {
      if (cloneMissing && repo.repo) {
        run(`git clone ${repo.repo} ${repoDir}`, configDir, dryRun);
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
    
    if (mode === 'stable') {
      const skipIfNoDiff = repo.skipIfNoDiff ?? config.skipIfNoDiff ?? true;
      const shouldCheckDiff = !dryRun && skipIfNoDiff && !branchOverride;
      
      if (shouldCheckDiff) {
        // For stable mode: check if dev branch has changes that main doesn't
        const devBranch = config.modes.find(m => m.name === 'test')?.branch || 'dev';
        
        // Ensure we have latest dev refs
        try {
          runQuiet(`git fetch origin ${devBranch}:refs/remotes/origin/${devBranch}`, repoDir);
        } catch (err) {
          console.log(`Warning: Could not fetch ${devBranch}: ${err.message}`);
        }
        
        // Count commits that dev has but main doesn't
        const commitsAhead = parseInt(runQuiet(`git rev-list --count ${branch}..origin/${devBranch}`, repoDir)) || 0;
        
        if (commitsAhead === 0) {
          console.log(`No changes in origin/${devBranch} vs ${branch}. Skipping publish.`);
          summary.push({
            name: repo.name,
            status: 'skipped',
            reason: 'no-diff'
          });
          continue;
        } else {
          console.log(`Found ${commitsAhead} commit(s) in ${devBranch} not in ${branch}. Will merge and publish.`);
          shouldMergeDev = true;
        }
      }
    }
    
    // For stable mode: check if we need to merge dev (even if skipIfNoDiff is disabled)
    if (mode === 'stable' && !shouldMergeDev) {
      const devBranch = config.modes.find(m => m.name === 'test')?.branch || 'dev';
      
      try {
        runQuiet(`git fetch origin ${devBranch}:refs/remotes/origin/${devBranch}`, repoDir);
        const commitsAhead = parseInt(runQuiet(`git rev-list --count ${branch}..origin/${devBranch}`, repoDir)) || 0;
        
        if (commitsAhead > 0) {
          console.log(`Found ${commitsAhead} commit(s) in ${devBranch} not in ${branch}. Will merge before publish.`);
          shouldMergeDev = true;
        }
      } catch (err) {
        console.log(`Warning: Could not check ${devBranch}: ${err.message}`);
      }
    }
    
    // Merge dev into main before publishing (stable mode only)
    if (mode === 'stable' && shouldMergeDev) {
      const devBranch = config.modes.find(m => m.name === 'test')?.branch || 'dev';
      console.log(`Merging origin/${devBranch} into ${branch}...`);
      try {
        run(`git merge origin/${devBranch} -m "Merge ${devBranch} into ${branch} for release [skip ci]"`, repoDir, dryRun);
      } catch (err) {
        throw new Error(`Failed to merge origin/${devBranch} into ${branch}. Please resolve conflicts manually.`);
      }
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

    if (repo.build !== false) {
      const buildCmd = repo.build || config.defaultBuild || 'npm run build';
      runSteps(repo.beforeBuild, repoDir, dryRun);
      if (hasScript(pkg, 'build') || repo.build) {
        run(buildCmd, repoDir, dryRun);
      } else {
        console.log('No build script found. Skipping build.');
      }
      runSteps(repo.afterBuild, repoDir, dryRun);
    }

    runSteps(repo.beforePublish, repoDir, dryRun);

    if (mode === 'test') {
      const result = publishTest(repoDir, effectiveModeConfig, dryRun);
      summary.push({
        name: repo.name,
        status: dryRun ? 'dry-run' : 'published',
        packageName: result.packageName || null,
        version: result.version,
        tag: result.tag,
        publishedAs: result.packageName ? `${result.packageName}@${result.version}` : null
      });
    } else if (mode === 'stable') {
      const result = publishStable(repoDir, effectiveModeConfig, dryRun);
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
