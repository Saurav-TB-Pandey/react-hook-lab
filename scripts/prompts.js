/**
 * Centralized file for Gemini AI prompts used in CI/CD publishing.
 */

function getArticlePrompt(repoName, changesSummary) {
  return `You are a developer advocate and technical writer. 
I have just pushed updates to my open source library "${repoName}".

Here are the details of the recent commits and their code changes:
${changesSummary}

Based on these changes:
1. Figure out if this includes major updates, minor updates, bug fixes, or code removals/reverts by analyzing the code diffs.
2. Be strictly honest and factual about what changed. If a feature or file was removed or reverted, state that it was removed (e.g., as part of a cleanup or rollback). DO NOT hallucinate "new features" or "DX improvements" out of simple deletions.
3. Do NOT mention raw file names or paths (like "src/state/index.ts") in the article. Instead, mention the names of the actual hooks that were added, modified, or removed (e.g., "the useStep hook").
4. Write a highly engaging, friendly, and informative Dev.to article announcing these updates. Adjust the tone appropriately if it's just a maintenance or cleanup release.
5. Use markdown formatting. Include sections like "What's Changed", "Why it matters", etc. if applicable.
6. Generate up to 4 relevant tags for the article. The tags MUST ALWAYS include "reacthooklab".
7. IMPORTANT: Tags must contain ONLY alphanumeric characters (no hyphens, spaces, or special characters).

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
