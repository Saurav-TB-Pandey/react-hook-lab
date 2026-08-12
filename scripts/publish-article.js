const fs = require('fs');
const path = require('path');
const { getChangesSummary } = require('./git-utils');
const { generateArticle } = require('./gemini-utils');
const { publishToDevTo } = require('./platforms/devto');
const { publishToLinkedIn } = require('./platforms/linkedin');
const { publishToBlogger } = require('./platforms/blogger');
const { publishToGitHub } = require('./platforms/github');
const { fetchPastAnalytics } = require('./analytics');

const { getArticlePrompt } = require('./prompts');

// Simple .env parser to avoid needing to install dotenv for testing locally
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  let currentKey = null;
  let currentValue = '';
  let inQuotes = false;

  const lines = envContent.split('\n');
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
            if (!process.env[currentKey]) process.env[currentKey] = currentValue;
        } else {
            currentValue += '\n';
        }
      } else {
        if (!process.env[currentKey]) process.env[currentKey] = rawVal;
      }
    } else {
      currentValue += line;
      if (currentValue.endsWith('"') && !currentValue.endsWith('\\"')) {
        inQuotes = false;
        currentValue = currentValue.substring(0, currentValue.length - 1);
        if (!process.env[currentKey]) process.env[currentKey] = currentValue;
      } else {
        currentValue += '\n';
      }
    }
  }
}

async function main() {
  const geminiApiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(key => key && !key.includes('your_gemini_api_key'));

  if (geminiApiKeys.length === 0) {
    console.error('ERROR: No valid GEMINI_API_KEY environment variables found.');
    process.exit(1);
  }

  // 1. Get code changes
  const { changesSummary, commitCount } = getChangesSummary();
  if (!changesSummary) {
    console.log('No relevant changes to publish.');
    process.exit(0);
  }

  console.log(`Analyzing changes for ${commitCount} commits...`);

  // 1b. Fetch analytics
  const analyticsSummary = await fetchPastAnalytics();

  // 2. Build Prompt
  const prompt = getArticlePrompt(changesSummary, analyticsSummary);

  try {
    // 3. Generate article using Gemini
    const articleData = await generateArticle(geminiApiKeys, prompt);
    console.log(`Generated Article Title: ${articleData.devto_title}`);

    // 3. Publish to platforms

    // -> Blogger (Publish first to get canonical URL)
    let bloggerUrl = null;
    const googleToken = process.env.GOOGLE_ACCESS_TOKEN;
    const blogId = process.env.BLOGGER_BLOG_ID;
    if (googleToken && blogId) {
      const bloggerResult = await publishToBlogger(googleToken, blogId, articleData);
      bloggerUrl = bloggerResult ? bloggerResult.url : null;
    } else {
      console.log('Skipping Blogger: Missing GOOGLE_ACCESS_TOKEN or BLOGGER_BLOG_ID');
    }

    // -> Dev.to (Standalone article, but link to Blogger at the bottom)
    const devtoResult = await publishToDevTo(process.env.DEVTO_API_KEY, articleData, bloggerUrl);
    const devtoUrl = devtoResult ? devtoResult.url : null;

    // -> LinkedIn
    await publishToLinkedIn(articleData, bloggerUrl);

    // -> GitHub Release
    if (articleData.github_release_markdown) {
      // Handle the fact that GitHub Actions sets it as GH_TOKEN, local .env is often GH_PAT
      const ghToken = process.env.GH_TOKEN || process.env.GH_PAT;
      await publishToGitHub(ghToken, articleData.github_release_markdown);
    }
  } catch (error) {
    console.error('\nAn error occurred during the publishing process:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
