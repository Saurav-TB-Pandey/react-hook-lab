const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Updates a GitHub repository secret by reading its value from the .env file.
 * 
 * @param {string} secretName - The name of the secret (e.g., "NPM_TOKEN") to pull from .env
 */
function updateGithubSecret(secretName, overrideValue = null) {
  if (!secretName) {
    throw new Error('Secret Name is required.');
  }

  let secretValue = overrideValue;

  if (!secretValue) {
    // Read the value directly from the .env file in the project root
    const envPath = path.resolve(__dirname, '../../.env');
    if (!fs.existsSync(envPath)) {
      throw new Error(`Cannot find .env file at ${envPath}`);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    let currentKey = null;
    let currentValue = '';
    let inQuotes = false;
    const parsedEnv = {};

    const lines = envContent.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!inQuotes) {
        if (line.trim() === '' || line.startsWith('#')) continue;
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) continue;
        currentKey = line.substring(0, eqIndex).trim();
        let rawVal = line.substring(eqIndex + 1).trim();
        
        if (rawVal.startsWith('"')) {
          inQuotes = true;
          currentValue = rawVal.substring(1);
          if (currentValue.endsWith('"') && !currentValue.endsWith('\\"')) {
              inQuotes = false;
              currentValue = currentValue.substring(0, currentValue.length - 1);
              parsedEnv[currentKey] = currentValue;
          } else {
              currentValue += '\n';
          }
        } else {
          parsedEnv[currentKey] = rawVal;
        }
      } else {
        currentValue += line;
        if (currentValue.endsWith('"') && !currentValue.endsWith('\\"')) {
          inQuotes = false;
          currentValue = currentValue.substring(0, currentValue.length - 1);
          parsedEnv[currentKey] = currentValue;
        } else {
          currentValue += '\n';
        }
      }
    }

    secretValue = parsedEnv[secretName];
  }
  if (secretValue === null || secretValue === undefined) {
    throw new Error(`Secret '${secretName}' was not found in the .env file and no override was provided.`);
  }

  // 1. Determine the safest way to call GitHub CLI
  // We use the absolute path if available to bypass any Windows PATH caching issues
  let ghCommand = 'gh';
  const ghFallbackPath = 'C:\\Program Files\\GitHub CLI\\gh.exe';
  if (fs.existsSync(ghFallbackPath)) {
    ghCommand = `"${ghFallbackPath}"`;
  }

  // 2. Hardcode your repository to ensure it NEVER updates another repo accidentally
  const repo = 'Saurav-TB-Pandey/react-hook-lab';

  try {
    console.log(`🚀 Updating secret '${secretName}' on ${repo}...`);

    // 3. We pipe the secret securely via standard input ('input' option) so it never
    // gets logged in terminal history or causes quote-escaping bugs in the shell.
    execSync(`${ghCommand} secret set ${secretName} --repo ${repo}`, {
      input: secretValue,
      stdio: ['pipe', 'inherit', 'inherit'] // Pipe stdin, let stdout/stderr pass through
    });

    console.log(`✅ Successfully updated secret: ${secretName}`);
  } catch (error) {
    console.error(`❌ Failed to update secret ${secretName}.`);
    console.error(`Are you authenticated? Try running: ${ghCommand} auth login`);
    throw error;
  }
}

module.exports = { updateGithubSecret };

// Allow the script to be run directly from the terminal for manual testing:
// Example: node update-github-secret.js MY_SECRET
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length >= 1) {
    updateGithubSecret(args[0]);
  } else {
    console.log('Usage: node update-github-secret.js <SECRET_NAME>');
  }
}
