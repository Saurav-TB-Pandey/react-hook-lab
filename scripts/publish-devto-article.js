const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const devtoApiKey = process.env.DEVTO_API_KEY;

  if (!geminiApiKey || !devtoApiKey) {
    console.error('Missing GEMINI_API_KEY or DEVTO_API_KEY environment variables.');
    process.exit(1);
  }

  // Get Github Action event payload
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    console.error('GITHUB_EVENT_PATH is not set or file does not exist. This script must be run within a GitHub Action.');
    process.exit(1);
  }

  const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const commits = eventData.commits || [];

  if (commits.length === 0) {
    console.log('No commits found in the push event payload. Skipping article generation.');
    return;
  }

  // Format the changes for Gemini
  const repoName = eventData.repository?.name || 'react-hook-lab';
  
  let changesSummary = '';
  for (const c of commits) {
    changesSummary += `- Commit Message: ${c.message}\n`;
    try {
      // Get the diff for this commit, excluding package-lock.json to avoid huge payloads
      const diffStr = execSync(`git show ${c.id} --stat -p -- . ":!package-lock.json" ":!yarn.lock"`, { encoding: 'utf8' });
      // Truncate if it's insanely long (e.g., > 20000 chars)
      const truncatedDiff = diffStr.length > 20000 ? diffStr.substring(0, 20000) + '\n... [DIFF TRUNCATED]' : diffStr;
      changesSummary += `  Diff:\n${truncatedDiff}\n\n`;
    } catch (e) {
      console.log(`Could not get diff for commit ${c.id}`);
      changesSummary += `  - Added files: ${c.added?.length ? c.added.join(', ') : 'None'}\n` +
                        `  - Modified files: ${c.modified?.length ? c.modified.join(', ') : 'None'}\n` +
                        `  - Removed files: ${c.removed?.length ? c.removed.join(', ') : 'None'}\n\n`;
    }
  }

  console.log(`Analyzing changes for ${commits.length} commits...`);

  // Prompt for Gemini AI
  const prompt = `You are a developer advocate and technical writer. 
I have just pushed updates to my open source library "${repoName}".

Here are the details of the recent commits and their code changes:
${changesSummary}

Based on these changes:
1. Figure out if this includes major updates, minor updates, or new features by analyzing the code diffs.
2. Write a highly engaging, friendly, and informative Dev.to article announcing these updates.
3. Use markdown formatting. Include sections like "What's New", "Why it matters", etc. if applicable.
4. Generate up to 4 relevant tags for the article. The tags MUST ALWAYS include "react-hook-lab".

Return ONLY a valid JSON object (do not wrap it in markdown code blocks like \`\`\`json) with the following structure:
{
  "title": "A catchy title for the dev.to article",
  "body_markdown": "The markdown content of the article",
  "tags": ["react-hook-lab", "tag2", "tag3"]
}`;

  // Call Gemini API
  console.log('Calling Gemini API...');
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
  
  try {
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error(`Gemini API Error: ${geminiRes.status} ${geminiRes.statusText}\n${err}`);
      process.exit(1);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
       console.error('Invalid response from Gemini:', JSON.stringify(geminiData, null, 2));
       process.exit(1);
    }

    // Clean up potential markdown code block wrapping from the JSON response
    let cleanJsonStr = rawText.trim();
    if (cleanJsonStr.startsWith('```json')) {
      cleanJsonStr = cleanJsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const articleData = JSON.parse(cleanJsonStr);

    console.log(`Generated Article Title: ${articleData.title}`);
    
    // Call Dev.to API
    console.log('Publishing to Dev.to...');
    const devtoUrl = 'https://dev.to/api/articles';
    const devtoRes = await fetch(devtoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': devtoApiKey
      },
      body: JSON.stringify({
        article: {
          title: articleData.title,
          body_markdown: articleData.body_markdown,
          published: true, // You can set this to false to create a draft first
          tags: articleData.tags || ['react-hook-lab', 'react', 'webdev', 'opensource']
        }
      })
    });

    if (!devtoRes.ok) {
       const err = await devtoRes.text();
       console.error(`Dev.to API Error: ${devtoRes.status} ${devtoRes.statusText}\n${err}`);
       process.exit(1);
    }

    const devtoData = await devtoRes.json();
    console.log(`Successfully published! Article URL: ${devtoData.url}`);

  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

main();
