/**
 * Generates an article using Gemini API with multiple model fallbacks to handle high demand.
 */
async function generateArticle(geminiApiKeys, prompt) {
  console.log('Calling Gemini API (with fallbacks)...');
  
  const keys = Array.isArray(geminiApiKeys) ? geminiApiKeys : [geminiApiKeys].filter(Boolean);
  if (keys.length === 0) {
    throw new Error("No Gemini API keys provided.");
  }

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
    console.log(`Trying model: ${model}...`);
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      console.log(`  -> Using API Key ${i + 1}/${keys.length}`);
      
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
          console.warn(`    -> Failed with status ${geminiRes.status}: ${err}`);
          
          // If the model is not found, trying other keys on the same model is pointless
          if (geminiRes.status === 404) {
            break; 
          }
          // Otherwise (429 rate limit, 403 auth/billing, 500 server error), try the next key
          continue;
        }

        const geminiData = await geminiRes.json();
        rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (rawText) {
           console.log(`    -> Success! Generated using ${model} with Key ${i + 1}`);
           break;
        }
      } catch (e) {
        console.warn(`    -> Exception when trying Key ${i + 1}:`, e.message);
      }
    }
    
    if (rawText) break; // Break out of model loop if we got text
  }

  if (!rawText) {
     throw new Error('All attempted Gemini models and API keys failed to generate content.');
  }

  // Clean up potential markdown code block wrapping from the JSON response
  let cleanJsonStr = rawText.trim();
  if (cleanJsonStr.startsWith('```json')) {
    cleanJsonStr = cleanJsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (cleanJsonStr.startsWith('```')) {
    cleanJsonStr = cleanJsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  try {
    const parsedData = JSON.parse(cleanJsonStr);
    
    // Validate the shape of the data
    if (!parsedData.devto_title || typeof parsedData.devto_title !== 'string') throw new Error('Missing or invalid "devto_title"');
    if (!parsedData.blogger_title || typeof parsedData.blogger_title !== 'string') throw new Error('Missing or invalid "blogger_title"');
    if (!parsedData.body_markdown || typeof parsedData.body_markdown !== 'string') throw new Error('Missing or invalid "body_markdown"');
    if (!parsedData.body_html || typeof parsedData.body_html !== 'string') throw new Error('Missing or invalid "body_html"');
    if (parsedData.linkedin_post && typeof parsedData.linkedin_post !== 'string') {
      throw new Error('Invalid "linkedin_post" format');
    }
    
    // Validate tags
    if (!Array.isArray(parsedData.tags)) throw new Error('Missing or invalid "tags" array');
    if (parsedData.tags.length > 4) {
      console.warn('AI generated more than 4 tags. Truncating to 4.');
      parsedData.tags = parsedData.tags.slice(0, 4);
    }
    
    // Ensure all tags are alphanumeric and lowercase
    parsedData.tags = parsedData.tags.map(tag => {
      const sanitized = tag.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase(); // allow hyphens for "term-itself"
      if (!sanitized) throw new Error(`Tag "${tag}" became empty after sanitization.`);
      return sanitized;
    });

    return parsedData;
    
  } catch (err) {
    console.error('Failed to parse or validate Gemini output. Error:', err.message);
    console.error('Raw output from AI:');
    console.error(cleanJsonStr);
    throw new Error(`LLM output validation failed: ${err.message}`);
  }
}

module.exports = {
  generateArticle
};
