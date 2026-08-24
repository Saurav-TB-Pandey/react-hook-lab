/**
 * Publishes an article to CoderLegion.
 */
async function publishToCoderLegion(apiKey, articleData, bloggerUrl = null) {
  if (!apiKey) {
    console.log('Skipping CoderLegion publication: CODERLEGION_API_KEY is not set.');
    return;
  }

  console.log('Publishing to CoderLegion...');
  const coderlegionUrl = 'https://coderlegion.com/api/v1/posts';
  
  // Append the Blogger URL to the bottom of the article markdown if it exists
  let finalMarkdown = articleData.body_markdown;
  if (bloggerUrl) {
    finalMarkdown += `\n\n---\n*Originally published on my blog. You can [read the alternative breakdown here](${bloggerUrl}).*`;
  }

  const coderlegionRes = await fetch(coderlegionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      title: articleData.devto_title || articleData.title, // using devto title as standard
      content: finalMarkdown,
      category_id: 2, // 2 is Articles according to the docs
      tags: (articleData.tags || ['reacthooklab', 'react', 'webdev', 'opensource'])
              .map(t => t.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())
              .filter(t => t.length > 0)
              .slice(0, 5),
      source_url: bloggerUrl || ""
    })
  });

  if (!coderlegionRes.ok) {
     const err = await coderlegionRes.text();
     throw new Error(`CoderLegion API Error: ${coderlegionRes.status} ${coderlegionRes.statusText}\n${err}`);
  }

  const coderlegionData = await coderlegionRes.json();
  if (coderlegionData.queued) {
    console.log(`Successfully submitted to CoderLegion! Article ID: ${coderlegionData.data?.id}`);
    console.log(`Note: Your post is currently QUEUED FOR MODERATION and will not be visible until approved.`);
  } else {
    console.log(`Successfully published to CoderLegion! Article ID: ${coderlegionData.data?.id}`);
  }
  return coderlegionData;
}

module.exports = {
  publishToCoderLegion
};
