const fs = require('fs');
const path = require('path');
const { generateArticle } = require('./gemini-utils');
const { publishToDevTo } = require('./platforms/devto');
const { publishToLinkedIn } = require('./platforms/linkedin');
const { publishToBlogger } = require('./platforms/blogger');
const { getMilestonePrompt } = require('./prompts');
const { updateGithubSecret } = require('./auth/update-github-secret');

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
  const packageName = 'react-hook-lab';
  console.log(`Checking NPM downloads for ${packageName}...`);

  try {
    // Fetch all-time downloads for the package using npm stat API or npmjs directly.
    const response = await fetch(`https://api.npmjs.org/downloads/point/2015-01-01:2099-01-01/${packageName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch NPM downloads: ${response.statusText}`);
    }
    const data = await response.json();
    const totalDownloads = data.downloads;
    
    console.log(`Total NPM Downloads: ${totalDownloads}`);

    const lastMilestone = parseInt(process.env.LAST_MILESTONE || '0', 10);
    
    // Determine the next milestone in the sequence
    const milestones = [5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000];
    
    let nextMilestone = milestones.find(m => m > lastMilestone) || milestones[milestones.length - 1];

    if (totalDownloads >= nextMilestone) {
      console.log(`🎉 New Milestone Reached: ${nextMilestone} downloads!`);

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

      // Build Prompt
      const prompt = getMilestonePrompt(nextMilestone);

      // Generate article using Gemini
      const articleData = await generateArticle(geminiApiKeys, prompt);
      console.log(`Generated Article Title: ${articleData.devto_title}`);

      // Publish to platforms
      let bloggerUrl = null;
      const googleToken = process.env.GOOGLE_ACCESS_TOKEN;
      const blogId = process.env.BLOGGER_BLOG_ID;
      if (googleToken && blogId) {
        const bloggerResult = await publishToBlogger(googleToken, blogId, articleData);
        bloggerUrl = bloggerResult ? bloggerResult.url : null;
      } else {
        console.log('Skipping Blogger: Missing GOOGLE_ACCESS_TOKEN or BLOGGER_BLOG_ID');
      }

      const devtoResult = await publishToDevTo(process.env.DEVTO_API_KEY, articleData, bloggerUrl);
      const devtoUrl = devtoResult ? devtoResult.url : null;

      await publishToLinkedIn(articleData, bloggerUrl);
      
      // Update .env locally if it exists
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Handle replacing or appending
        const envLines = envContent.split(/\r?\n/);
        let found = false;
        for (let i = 0; i < envLines.length; i++) {
          if (envLines[i].startsWith('LAST_MILESTONE=')) {
            envLines[i] = `LAST_MILESTONE=${nextMilestone}`;
            found = true;
            break;
          }
        }
        
        if (!found) {
          envLines.push(`LAST_MILESTONE=${nextMilestone}`);
        }
        
        fs.writeFileSync(envPath, envLines.join('\n'), 'utf8');
        console.log('Updated LAST_MILESTONE in local .env');
      } else {
        fs.writeFileSync(envPath, `LAST_MILESTONE=${nextMilestone}\n`, 'utf8');
      }
      
      // Update GitHub Secret
      try {
        console.log('Updating GitHub Secret LAST_MILESTONE...');
        // Pass the value as the overrideValue argument
        updateGithubSecret('LAST_MILESTONE', nextMilestone.toString());
      } catch (e) {
        console.warn('Failed to update GitHub Secret. This might be expected if running outside of GH CLI context or lacking GH_TOKEN.');
      }

    } else {
      console.log(`Not at the next milestone yet. Next target: ${nextMilestone}.`);
    }
  } catch (error) {
    console.error('\nAn error occurred during the checking process:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
