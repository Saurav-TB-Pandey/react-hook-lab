const https = require('https');

// Helper to make simple HTTPS GET requests
function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            resolve({ error: true, status: res.statusCode, data });
          }
        } catch (e) {
          resolve({ error: true, data });
        }
      });
    });
    req.on('error', (err) => resolve({ error: true, message: err.message }));
  });
}

/**
 * Fetch last 2 Dev.to articles and their engagement.
 */
async function getDevToAnalytics(apiKey) {
  console.log('\n--- DEV.TO ANALYTICS ---');
  if (!apiKey) {
    console.log('Skipping: No DEVTO_API_KEY provided.');
    return null;
  }
  
  console.log('Fetching from /api/articles/me/published...');
  const res = await fetchJson('https://dev.to/api/articles/me/published?per_page=2', {
    'api-key': apiKey,
    'User-Agent': 'ReactHookLab-Automator'
  });
  
  if (res.error || !Array.isArray(res)) {
    console.log('Error fetching Dev.to analytics:', res);
    return null;
  }

  console.log(`Successfully fetched ${res.length} Dev.to articles.`);
  const extracted = res.slice(0, 2).map(article => ({
    title: article.title,
    views: article.page_views_count || 0,
    reactions: article.public_reactions_count || 0,
    comments: article.comments_count || 0,
    url: article.url
  }));
  
  console.log('Extracted Data:', extracted);
  return extracted;
}

/**
 * Fetch last 2 Blogger posts and their comments.
 */
async function getBloggerAnalytics(token, blogId) {
  console.log('\n--- BLOGGER ANALYTICS ---');
  if (!token || !blogId) {
    console.log('Skipping: Missing GOOGLE_ACCESS_TOKEN or BLOGGER_BLOG_ID.');
    return null;
  }
  
  const url = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?fetchBodies=false&maxResults=2`;
  console.log(`Fetching from Blogger API v3...`);
  const res = await fetchJson(url, {
    'Authorization': `Bearer ${token}`
  });

  if (res.error) {
    console.log('Error fetching Blogger analytics:', res);
    return null;
  }
  if (!res.items) {
    console.log('No posts found on Blogger.');
    return null;
  }

  console.log(`Successfully fetched ${res.items.length} Blogger posts.`);
  const extracted = res.items.slice(0, 2).map(post => ({
    title: post.title,
    comments: post.replies ? post.replies.totalItems : 0,
    url: post.url
  }));

  console.log('Extracted Data:', extracted);
  return extracted;
}

/**
 * Fetch last 2 LinkedIn posts and their engagement.
 */
async function getLinkedInAnalytics(token) {
  console.log('\n--- LINKEDIN ANALYTICS ---');
  if (!token) {
    console.log('Skipping: No LINKEDIN_ACCESS_TOKEN provided.');
    return null;
  }
  
  try {
    console.log('Fetching LinkedIn Author URN...');
    const profileRes = await fetchJson('https://api.linkedin.com/v2/userinfo', {
      'Authorization': `Bearer ${token}`
    });
    
    if (profileRes.error || !profileRes.sub) {
      console.log('Error fetching LinkedIn profile (Token might lack permissions):', profileRes);
      return null;
    }
    
    const authorUrn = `urn:li:person:${profileRes.sub}`;
    console.log(`Author URN: ${authorUrn}`);

    console.log('Fetching recent LinkedIn posts (ugcPosts)...');
    const postsRes = await fetchJson(`https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent(authorUrn)})&count=2`, {
      'Authorization': `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0'
    });

    if (postsRes.error || !postsRes.elements) {
      console.log('Error fetching LinkedIn posts (Token likely lacks r_organization_social or similar permissions for personal feeds):', postsRes);
      return null;
    }

    console.log(`Found ${postsRes.elements.length} LinkedIn posts. Fetching social actions (likes/comments)...`);
    const analytics = [];
    for (const post of postsRes.elements) {
      const actionsRes = await fetchJson(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(post.id)}`, {
        'Authorization': `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      });
      
      analytics.push({
        id: post.id,
        likes: actionsRes.error ? 0 : (actionsRes.likesSummary?.totalLikes || 0),
        comments: actionsRes.error ? 0 : (actionsRes.commentsSummary?.totalFirstDegreeComments || 0)
      });
    }

    console.log('Extracted Data:', analytics);
    return analytics;
  } catch (e) {
    console.log('Exception in LinkedIn Analytics:', e.message);
    return null;
  }
}

/**
 * Orchestrates fetching analytics from all platforms and formatting a summary string for the AI.
 */
async function fetchPastAnalytics() {
  console.log('Fetching analytics from previously published articles...');
  
  const devtoKey = process.env.DEVTO_API_KEY;
  const googleToken = process.env.GOOGLE_ACCESS_TOKEN;
  const blogId = process.env.BLOGGER_BLOG_ID;
  const linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN;

  const [devto, blogger, linkedin] = await Promise.all([
    getDevToAnalytics(devtoKey),
    getBloggerAnalytics(googleToken, blogId),
    getLinkedInAnalytics(linkedinToken)
  ]);

  let summary = '### Past Article Engagement Data\n';
  summary += 'Use the following data from the most recently published articles to evaluate what works and what doesn\'t. If engagement (views/likes/comments) was low, change your formatting, tone, and hook for this new article. If engagement was high, analyze why and lean into that style!\n\n';

  let hasData = false;

  if (devto && devto.length > 0) {
    hasData = true;
    summary += '#### Dev.to (Developer Audience)\n';
    devto.forEach((post, i) => {
      summary += `- Post ${i + 1} ("${post.title}"): ${post.views} views, ${post.reactions} reactions, ${post.comments} comments.\n`;
    });
  }

  if (blogger && blogger.length > 0) {
    hasData = true;
    summary += '\n#### Blogger (General Web Audience)\n';
    blogger.forEach((post, i) => {
      summary += `- Post ${i + 1} ("${post.title}"): ${post.comments} comments.\n`;
    });
  }

  if (linkedin && linkedin.length > 0) {
    hasData = true;
    summary += '\n#### LinkedIn (Professional Network)\n';
    linkedin.forEach((post, i) => {
      summary += `- Post ${i + 1}: ${post.likes} likes, ${post.comments} comments.\n`;
    });
  }

  if (!hasData) {
    return "";
  }

  return summary;
}

module.exports = {
  fetchPastAnalytics
};
