/**
 * Centralized file for Gemini AI prompts used in CI/CD publishing.
 */

function getArticlePrompt(changesSummary, analyticsSummary = '') {
  if (!process.env.SECRET_AI_PROMPT) {
    throw new Error('SECRET_AI_PROMPT environment variable is missing. Please configure it in your .env or GitHub Secrets.');
  }

  let customPrompt = process.env.SECRET_AI_PROMPT;
  customPrompt = customPrompt.replace(/\{\{changesSummary\}\}/g, changesSummary);
  
  if (analyticsSummary) {
    customPrompt += '\n\n' + analyticsSummary;
  }

  // Unescape literal \n strings back into real newlines if they were escaped in a .env single line
  customPrompt = customPrompt.replace(/\\n/g, '\n');

  return customPrompt;
}

function getMilestonePrompt(milestone) {
  if (!process.env.SECRET_MILESTONE_PROMPT) {
    throw new Error('SECRET_MILESTONE_PROMPT environment variable is missing. Please configure it in your .env or GitHub Secrets.');
  }

  let customPrompt = process.env.SECRET_MILESTONE_PROMPT;
  customPrompt = customPrompt.replace(/\{\{milestone\}\}/g, milestone.toLocaleString());

  // Unescape literal \n strings back into real newlines if they were escaped in a .env single line
  customPrompt = customPrompt.replace(/\\n/g, '\n');

  return customPrompt;
}

function getDailyTechTermPrompt(usedTerms) {
  if (!process.env.SECRET_DAILY_TERM_PROMPT) {
    throw new Error('SECRET_DAILY_TERM_PROMPT environment variable is missing. Please configure it in your .env or GitHub Secrets.');
  }

  let customPrompt = process.env.SECRET_DAILY_TERM_PROMPT;
  customPrompt = customPrompt.replace(/\{\{PREVIOUSLY_USED_TERMS\}\}/g, usedTerms || 'No terms used yet.');

  // Unescape literal \n strings back into real newlines if they were escaped in a .env single line
  customPrompt = customPrompt.replace(/\\n/g, '\n');

  return customPrompt;
}

module.exports = {
  getArticlePrompt,
  getMilestonePrompt,
  getDailyTechTermPrompt
};
