/**
 * Publishes an article to Dev.to.
 */
async function publishToDevTo(apiKey, articleData, canonicalUrl = null) {
  if (!apiKey) {
    console.log('Skipping Dev.to publication: DEVTO_API_KEY is not set.');
    return;
  }

  console.log('Publishing to Dev.to...');
  const devtoUrl = 'https://dev.to/api/articles';
  const devtoRes = await fetch(devtoUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      article: {
        title: articleData.devto_title,
        body_markdown: articleData.body_markdown,
        published: true, // Set to true for live articles
        canonical_url: canonicalUrl || undefined,
        tags: (articleData.tags || ['reacthooklab', 'react', 'webdev', 'opensource'])
                .map(t => t.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
                .filter(t => t.length > 0)
                .slice(0, 4) // Dev.to allows max 4 tags
      }
    })
  });

  if (!devtoRes.ok) {
     const err = await devtoRes.text();
     throw new Error(`Dev.to API Error: ${devtoRes.status} ${devtoRes.statusText}\n${err}`);
  }

  const devtoData = await devtoRes.json();
  console.log(`Successfully published to Dev.to! Article URL: ${devtoData.url}`);
  return devtoData;
}

module.exports = {
  publishToDevTo
};
