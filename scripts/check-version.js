const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run() {
  try {
    const srcPath = path.join(__dirname, '..', 'src');
    if (!fs.existsSync(srcPath)) return;

    // Check if there are uncommitted changes in src/
    const uncommittedSrcChanges = execSync('git status --porcelain src/', { encoding: 'utf8' }).trim();
    
    // Check if there are committed changes in src/ compared to origin/master
    // Fallback to checking against local master if origin/master fails
    let baseBranch = 'origin/master';
    try {
      execSync('git rev-parse --verify origin/master', { stdio: 'ignore' });
    } catch {
      baseBranch = 'master';
    }

    let committedSrcChanges = '';
    try {
      // Get merge base to compare only the changes introduced in the current branch
      const mergeBase = execSync(`git merge-base ${baseBranch} HEAD`, { encoding: 'utf8' }).trim();
      committedSrcChanges = execSync(`git diff ${mergeBase}...HEAD --name-only src/`, { encoding: 'utf8' }).trim();
    } catch (e) {
      // Ignore if merge base fails (e.g. first commit)
    }

    if (!uncommittedSrcChanges && !committedSrcChanges) {
      console.log('✅ No changes in src/ directory detected. Version bump check passed.');
      return;
    }

    // Read current package.json version
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const currentVersion = require(packageJsonPath).version;

    // Read base branch package.json version
    let baseVersion = null;
    try {
      const basePackageJsonStr = execSync(`git show ${baseBranch}:package.json`, { encoding: 'utf8' });
      const basePackageJson = JSON.parse(basePackageJsonStr);
      baseVersion = basePackageJson.version;
    } catch (e) {
      console.log(`⚠️ Could not find package.json on base branch (${baseBranch}). Skipping version check.`);
      return;
    }

    // If there are src/ changes but the version matches the base version, fail!
    if (currentVersion === baseVersion) {
      console.error('\n❌ ERROR: Changes detected in src/ but package.json version was not bumped!');
      console.error(`Current version (${currentVersion}) is identical to the version on ${baseBranch}.`);
      console.error('Please bump the version in package.json (e.g. npm version patch) before validating or publishing.\n');
      process.exit(1);
    }

    console.log(`✅ Version bumped correctly: ${baseVersion} -> ${currentVersion}`);
    
  } catch (error) {
    console.error('⚠️ Warning: Failed to run version check hook.', error.message);
  }
}

run();
