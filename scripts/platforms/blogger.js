const https = require('https');

async function publishToBlogger(accessToken, blogId, articleData) {
  return new Promise((resolve, reject) => {
    console.log('Publishing to Blogger...');

    if (!accessToken) {
      return reject(new Error('GOOGLE_ACCESS_TOKEN is required to publish to Blogger.'));
    }
    if (!blogId) {
      return reject(new Error('BLOGGER_BLOG_ID is required to publish to Blogger.'));
    }

    if (!articleData.body_html) {
      return reject(new Error('articleData.body_html is missing. Ensure your AI prompt asks for body_html.'));
    }

    const postData = JSON.stringify({
      kind: 'blogger#post',
      title: articleData.blogger_title,
      content: articleData.body_html,
      labels: articleData.tags || []
    });

    const options = {
      hostname: 'www.googleapis.com',
      port: 443,
      path: `/blogger/v3/blogs/${blogId}/posts/`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', async () => {
        try {
          // If response is not JSON, throw an error with the preview
          if (!res.headers['content-type']?.includes('application/json')) {
              throw new Error(`Blogger API returned non-JSON response. Status: ${res.statusCode}`);
          }
          
          const response = JSON.parse(data);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Successfully published to Blogger!`);
            console.log(`🔗 URL: ${response.url}`);
            resolve(response);
          } else if (res.statusCode === 401) {
            console.log('⚠️ Blogger API returned 401 Unauthorized. Access token might be expired.');
            
            const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            
            if (refreshToken && clientId && clientSecret) {
               try {
                 const { refreshGoogleToken } = require('../auth/refresh-google-token');
                 const newAccessToken = await refreshGoogleToken(clientId, clientSecret, refreshToken);
                 
                 // Update the environment with the new token so other scripts might use it
                 process.env.GOOGLE_ACCESS_TOKEN = newAccessToken;
                 
                 console.log('🔄 Retrying publish to Blogger with new access token...');
                 const retryResult = await publishToBlogger(newAccessToken, blogId, articleData);
                 resolve(retryResult);
               } catch (refreshErr) {
                 reject(new Error(`Failed to refresh token and retry: ${refreshErr.message}`));
               }
            } else {
               reject(new Error(`Blogger API Error: 401 Unauthorized. Missing refresh token or client credentials in env to auto-refresh.`));
            }
          } else {
            reject(new Error(`Blogger API Error: ${response.error?.message || JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  publishToBlogger
};
