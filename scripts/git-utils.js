const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Reads the GitHub Action event payload and extracts commit messages and code diffs.
 */
function getChangesSummary() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    console.error('GITHUB_EVENT_PATH is not set or file does not exist. This script must be run within a GitHub Action.');
    return { repoName: 'unknown', changesSummary: null };
  }

  const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const commits = eventData.commits || [];

  if (commits.length === 0) {
    console.log('No commits found in the push event payload. Skipping.');
    return { repoName: eventData.repository?.name, changesSummary: null };
  }

  const repoName = eventData.repository?.name || 'react-hook-lab';
  
  let changesSummary = '';
  let validCommitCount = 0;

  for (const c of commits) {
    try {
      // TEMPORARILY COMMENTED OUT FOR TESTING
      // // Check if this commit actually changed anything in the src/ directory
      // const changedSrcFiles = execSync(`git diff-tree --no-commit-id --name-only -r ${c.id} src/`, { encoding: 'utf8' }).trim();
      // 
      // if (!changedSrcFiles) {
      //   console.log(`Commit ${c.id} did not touch the src/ folder. Skipping.`);
      //   continue; // Skip this commit
      // }

      validCommitCount++;
      changesSummary += `- Commit Message: ${c.message}\n`;
      
      // Get the diff for the ENTIRE commit (temporarily changed from src/ to . for testing)
      const diffStr = execSync(`git show ${c.id} --stat -p -- .`, { encoding: 'utf8' });
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
