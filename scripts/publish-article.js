const fs = require('fs');
const path = require('path');
const { getChangesSummary } = require('./git-utils');
const { generateArticle } = require('./gemini-utils');
const { publishToDevTo } = require('./platforms/devto');

const { getArticlePrompt } = require('./prompts');

// Simple .env parser to avoid needing to install dotenv for testing locally
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of envConfig) {
    if (line.trim() && !line.startsWith('#')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey || geminiApiKey.includes('your_gemini_api_key')) {
    console.error('ERROR: Missing GEMINI_API_KEY environment variable.');
    process.exit(1);
  }

  // 1. Get changes
  const { repoName, changesSummary, commitCount } = getChangesSummary();
  if (!changesSummary) {
    return; // No commits to process
  }
  
  console.log(`Analyzing changes for ${commitCount} commits...`);

  const prompt = getArticlePrompt(repoName, changesSummary);

  try {
    // 2. Generate article using Gemini
    const articleData = await generateArticle(geminiApiKey, prompt);
    console.log(`Generated Article Title: ${articleData.title}`);

    // 3. Publish to platforms
    
    // -> Dev.to
    await publishToDevTo(process.env.DEVTO_API_KEY, articleData);
    
    // -> You can add more platforms here in the future
    // await publishToHashnode(process.env.HASHNODE_API_KEY, articleData);
    // await publishToMedium(process.env.MEDIUM_API_KEY, articleData);

  } catch (error) {
    console.error('\nAn error occurred during the publishing process:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
