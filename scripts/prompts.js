/**
 * Centralized file for Gemini AI prompts used in CI/CD publishing.
 */

function getArticlePrompt(repoName, changesSummary) {
  return `You are a developer advocate and technical writer. 
I have just pushed updates to my open source library "${repoName}".

Here are the details of the recent commits and their code changes:
${changesSummary}

Based on these changes:
1. Figure out if this includes major updates, minor updates, or new features by analyzing the code diffs.
2. Write a highly engaging, friendly, and informative Dev.to article announcing these updates.
3. Use markdown formatting. Include sections like "What's New", "Why it matters", etc. if applicable.
4. Generate up to 4 relevant tags for the article. The tags MUST ALWAYS include "reacthooklab".
5. IMPORTANT: Tags must contain ONLY alphanumeric characters (no hyphens, spaces, or special characters).

Return ONLY a valid JSON object (do not wrap it in markdown code blocks like \`\`\`json) with the following structure:
{
  "title": "A catchy title for the article",
  "body_markdown": "The markdown content of the article",
  "tags": ["reacthooklab", "tag2", "tag3"]
}`;
}

module.exports = {
  getArticlePrompt
};
