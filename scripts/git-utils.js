const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Reads the GitHub Action event payload and extracts commit messages and code diffs.
 */
function getChangesSummary() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  let commits = [];
  let repoName = 'react-hook-lab';

  if (!eventPath || !fs.existsSync(eventPath)) {
    console.log('GITHUB_EVENT_PATH is not set (running locally). Falling back to the last commit for testing.');
    try {
      // Get the last commit that actually touched the src/ directory
      const lastCommitId = execSync('git log -1 --format="%H" -- src/', { encoding: 'utf8' }).trim();
      const lastCommitMsg = execSync('git log -1 --format="%s" -- src/', { encoding: 'utf8' }).trim();
      
      if (!lastCommitId) {
         throw new Error("No commits found that touched the src/ directory.");
      }
      commits = [{ id: lastCommitId, message: lastCommitMsg }];
    } catch (err) {
      console.error('Failed to retrieve local git commit:', err.message);
      return { repoName, changesSummary: null, commitCount: 0 };
    }
  } else {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    commits = eventData.commits || [];
    repoName = eventData.repository?.name || 'react-hook-lab';

    if (commits.length === 0) {
      console.log('No commits found in the push event payload. Skipping.');
      return { repoName, changesSummary: null, commitCount: 0 };
    }
  }


  
  let changesSummary = '';
  let validCommitCount = 0;

  for (const c of commits) {
    try {
      // Check if this commit actually changed anything in the src/ directory
      const changedSrcFiles = execSync(`git diff-tree --no-commit-id --name-only -r ${c.id} src/`, { encoding: 'utf8' }).trim();
      
      if (!changedSrcFiles) {
        console.log(`Commit ${c.id} did not touch the src/ folder. Skipping.`);
        continue; // Skip this commit
      }

      validCommitCount++;
      changesSummary += `- Commit Message: ${c.message}\n`;
      
      // Get the diff only for the src/ folder
      const diffStr = execSync(`git show ${c.id} --stat -p -- src/`, { encoding: 'utf8' });
      const truncatedDiff = diffStr.length > 20000 ? diffStr.substring(0, 20000) + '\n... [DIFF TRUNCATED]' : diffStr;
      changesSummary += `  Diff:\n${truncatedDiff}\n\n`;
    } catch (e) {
      console.log(`Could not process commit ${c.id}: ${e.message}`);
    }
  }

  if (validCommitCount === 0) {
    console.log('No commits modified the src/ folder. Skipping article generation.');
    return { repoName, changesSummary: null, commitCount: 0 };
  }

  return { repoName, changesSummary, commitCount: validCommitCount };
}

module.exports = {
  getChangesSummary
};
