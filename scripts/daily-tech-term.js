const fs = require('fs');
const path = require('path');
const { generateArticle } = require('./gemini-utils');
const { getDailyTechTermPrompt } = require('./prompts');
const { publishToBlogger } = require('./platforms/blogger');
const { publishToDevTo } = require('./platforms/devto');
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

  // 1. Fetch used tech terms from process.env
  const usedTerms = process.env.USED_TECH_TERMS || '';

  console.log('Fetching Daily Tech Term Prompt...');

  // 2. Build Prompt
  const prompt = getDailyTechTermPrompt(usedTerms);

  try {
    console.log('Generating daily tech term article via Gemini AI...');
    const generatedData = await generateArticle(geminiApiKeys, prompt);

    if (!generatedData) {
      throw new Error('Failed to generate article data');
    }

    console.log(`Generated content for term: "${generatedData.term}"`);
    console.log(`Blogger Title: ${generatedData.blogger_title}`);
    console.log(`Dev.to Title: ${generatedData.devto_title}`);

    // Append static resource links to the generated content
    generatedData.body_markdown += `\n\n---\n### Resources\n* **GitHub Repository:** [react-hook-lab](https://github.com/Saurav-TB-Pandey/react-hook-lab)\n* **react-hook-lab:** [npm package](https://www.npmjs.com/package/react-hook-lab)\n* **Connect with me on LinkedIn:** [Saurav Pandey](https://www.linkedin.com/in/pandeysaurav/)`;
    generatedData.body_html += `
<hr/>
<h3>Resources</h3>
<ul>
<li><b>GitHub Repository:</b> <a href="https://github.com/Saurav-TB-Pandey/react-hook-lab">react-hook-lab</a></li>
<li><b>react-hook-lab:</b> <a href="https://www.npmjs.com/package/react-hook-lab">npm package</a></li>
<li><b>Connect with me on LinkedIn:</b> <a href="https://www.linkedin.com/in/pandeysaurav/">Saurav Pandey</a></li>
</ul>
`;

    const isDryRun = process.argv.includes('--dry-run');

    let bloggerUrl = null;
    const googleToken = process.env.GOOGLE_ACCESS_TOKEN;
    const blogId = process.env.BLOGGER_BLOG_ID;

    if (isDryRun) {
      console.log('\n--- DRY RUN: Skipping Blogger Publish ---');
      console.log(`Title: ${generatedData.blogger_title}`);
    } else {
      // 3. Publish to Blogger
      try {
        if (googleToken && blogId) {
          const bloggerResult = await publishToBlogger(googleToken, blogId, generatedData);
          bloggerUrl = bloggerResult ? bloggerResult.url : null;
          console.log('Blogger publish complete.');
        } else {
          console.log('Skipping Blogger: Missing GOOGLE_ACCESS_TOKEN or BLOGGER_BLOG_ID');
        }
      } catch (e) {
        console.error('Failed to publish to Blogger:', e.message);
      }
    }

    if (isDryRun) {
      console.log('\n--- DRY RUN: Skipping Dev.to Publish ---');
      console.log(`Title: ${generatedData.devto_title}`);
      console.log(`\n${generatedData.body_markdown.substring(0, 300)}... (truncated)\n`);
    } else {
      // 4. Publish to Dev.to
      try {
        await publishToDevTo(process.env.DEVTO_API_KEY, generatedData, bloggerUrl);
        console.log('Dev.to publish complete.');
      } catch (e) {
        console.error('Failed to publish to Dev.to:', e.message);
      }
    }

    // 5. Update state
    if (isDryRun) {
      console.log('\n--- DRY RUN: Skipping State Update ---');
      console.log(`Would have added term: "${generatedData.term}" to USED_TECH_TERMS.`);
    } else {
      console.log('\nUpdating used tech terms state...');
      const newTerm = generatedData.term;
      if (newTerm) {
        let updatedTerms = usedTerms ? `${usedTerms}, ${newTerm}` : newTerm;

        // Update local .env
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          const lines = envContent.split(/\r?\n/);
          let found = false;

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('USED_TECH_TERMS=')) {
              lines[i] = `USED_TECH_TERMS="${updatedTerms}"`;
              found = true;
              break;
            }
          }

          if (!found) {
            lines.push(`USED_TECH_TERMS="${updatedTerms}"`);
          }

          fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
          console.log('Updated USED_TECH_TERMS in local .env');
        }

        // Update GitHub Secret (skip if running locally and no GH_PAT)
        if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
          console.log('Updating GitHub Secret USED_TECH_TERMS...');
          try {
            updateGithubSecret('USED_TECH_TERMS', updatedTerms);
          } catch (e) {
            console.error('Warning: Failed to update GitHub secret. Is GH_TOKEN configured?');
            console.error(e.message);
          }
        } else {
          console.log('Skipping GitHub Secret update (GH_TOKEN not found in environment).');
        }
      }
    }

    console.log('Daily tech term workflow completed successfully!');
  } catch (error) {
    console.error('Error during publishing workflow:', error);
    process.exit(1);
  }
}

main();
