/**
 * Generates an article using Gemini API with multiple model fallbacks to handle high demand.
 */
async function generateArticle(geminiApiKey, prompt) {
  console.log('Calling Gemini API (with fallbacks)...');
  
  const fallbackModels = [
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
    'gemini-pro-latest',
    'gemini-3-flash-preview',
    'gemini-2.5-pro',
    'gemma-4-31b-it'
  ];

  let rawText = null;

  for (const model of fallbackModels) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
    console.log(`Trying model: ${model}...`);
    
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
        console.warn(`  -> Failed with status ${geminiRes.status}: ${err}`);
        continue;
      }

      const geminiData = await geminiRes.json();
      rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
         console.log(`  -> Success! Generated using ${model}`);
         break;
      }
    } catch (e) {
      console.warn(`  -> Exception when trying ${model}:`, e.message);
    }
  }

  if (!rawText) {
     throw new Error('All attempted Gemini models failed to generate content.');
  }

  // Clean up potential markdown code block wrapping from the JSON response
  let cleanJsonStr = rawText.trim();
  if (cleanJsonStr.startsWith('```json')) {
    cleanJsonStr = cleanJsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (cleanJsonStr.startsWith('```')) {
    cleanJsonStr = cleanJsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  try {
    return JSON.parse(cleanJsonStr);
  } catch (err) {
    console.error('Failed to parse Gemini output as JSON. Raw output:');
    console.error(cleanJsonStr);
    throw new Error('Gemini output was not valid JSON.');
  }
}

module.exports = {
  generateArticle
};
