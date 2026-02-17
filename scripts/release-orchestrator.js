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

function ensureClean(repoDir) {
  const status = runQuiet('git status --porcelain', repoDir);
  if (status) {
    throw new Error('Working tree not clean. Commit or stash changes first.');
  }
}

function ensureBranch(repoDir, branch, dryRun) {
  run(`git checkout ${branch}`, repoDir, dryRun);
  run('git fetch origin', repoDir, dryRun);
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
  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];
    
    // Keep flags, option values, and packages with existing tags as-is
    if (part.startsWith('-') || part.startsWith('@') || part.includes('@')) {
      result.push(part);
    } else if (part === '') {
      // Skip empty strings
      continue;
    } else {
      // This is a package name, add tag
      result.push(`${part}@${tag}`);
    }
  }
  return result.join(' ');
}

function publishStable(repoDir, modeConfig, dryRun) {
  const bump = modeConfig.versionBump || 'patch';
  if (modeConfig.gitTag === false) {
    run(`npm version ${bump} --no-git-tag-version`, repoDir, dryRun);
  } else {
    run(`npm version ${bump} -m "Release %s"`, repoDir, dryRun);
  }

  const version = getPackageVersion(repoDir);

  const tag = modeConfig.npmTag && modeConfig.npmTag !== 'latest'
    ? `--tag ${modeConfig.npmTag}`
    : '';
  run(`npm publish ${tag}`.trim(), repoDir, dryRun);

  if (modeConfig.gitPush !== false && modeConfig.gitTag !== false) {
    const branch = modeConfig.branch || 'main';
    run(`git push origin ${branch} --follow-tags`, repoDir, dryRun);
  }

  return { version, tag: modeConfig.npmTag || 'latest' };
}

function publishTest(repoDir, modeConfig, dryRun) {
  const preid = modeConfig.preid || 'test';
  run(`npm version prerelease --preid ${preid} --no-git-tag-version`, repoDir, dryRun);

  const version = getPackageVersion(repoDir);

  const tag = modeConfig.npmTag || 'test';
  run(`npm publish --tag ${tag}`, repoDir, dryRun);

  console.log('Note: test publish updated package.json/package-lock.json.');
  console.log('      Use git restore to clean if you do not want to keep it.');

  return { version, tag };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode || 'stable';
  const configPath = path.resolve(process.cwd(), args.config || 'release.config.json');
  const dryRun = toBool(args['dry-run'], false);
  const cloneMissing = toBool(args['clone-missing'], false);
  const summaryPath = path.resolve(process.cwd(), args['summary-path'] || 'release-summary.json');
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
    const branch = repo.branch || modeConfig.branch || config.defaultBranch || 'main';
    const effectiveModeConfig = { ...modeConfig, branch };

    console.log(`\n==> ${repo.name} (${repoDir})`);

    if (!fs.existsSync(repoDir)) {
      if (cloneMissing && repo.repo) {
        run(`git clone ${repo.repo} ${repoDir}`, configDir, dryRun);
      } else {
        console.log('Skipping: repo directory not found.');
        continue;
      }
    }

    ensureClean(repoDir);
    ensureBranch(repoDir, branch, dryRun);

    const { behind, ahead } = getAheadBehind(repoDir, branch);
    if (behind > 0) {
      throw new Error(`Local branch behind origin/${branch}. Pull first.`);
    }

    const skipIfNoDiff = repo.skipIfNoDiff ?? config.skipIfNoDiff ?? true;
    if (skipIfNoDiff && ahead === 0) {
      console.log('No changes vs origin. Skipping publish.');
      summary.push({
        name: repo.name,
        status: 'skipped',
        reason: 'no-diff'
      });
      continue;
    }

    const pkg = getPackageJson(repoDir);

    if (repo.install !== false) {
      const installCmd = repo.install || config.defaultInstall || 'npm install';
      runSteps(repo.beforeInstall, repoDir, dryRun);
      run(installCmd, repoDir, dryRun);
      const npmTag = effectiveModeConfig.npmTag || 'latest';
      runSteps(repo.afterInstall, repoDir, dryRun, npmTag);
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
        version: result.version,
        tag: result.tag
      });
    } else if (mode === 'stable') {
      const result = publishStable(repoDir, effectiveModeConfig, dryRun);
      summary.push({
        name: repo.name,
        status: dryRun ? 'dry-run' : 'published',
        version: result.version,
        tag: result.tag
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
