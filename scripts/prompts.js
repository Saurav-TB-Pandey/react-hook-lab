/**
 * Centralized file for Gemini AI prompts used in CI/CD publishing.
 */

function getArticlePrompt(changesSummary) {
  if (!process.env.SECRET_AI_PROMPT) {
    throw new Error('SECRET_AI_PROMPT environment variable is missing. Please configure it in your .env or GitHub Secrets.');
  }

  let customPrompt = process.env.SECRET_AI_PROMPT;
  customPrompt = customPrompt.replace(/\{\{changesSummary\}\}/g, changesSummary);
  
  // Unescape literal \n strings back into real newlines if they were escaped in a .env single line
  customPrompt = customPrompt.replace(/\\n/g, '\n');

  return customPrompt;
}

module.exports = {
  getArticlePrompt
};
