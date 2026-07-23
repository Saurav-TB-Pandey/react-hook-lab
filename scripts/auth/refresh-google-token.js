const https = require('https');
const { updateGithubSecret } = require('./update-github-secret');

/**
 * Refreshes the Google OAuth Access Token using the provided Refresh Token.
 * Silently updates the GITHUB_SECRET and returns the new token.
 * 
 * @param {string} clientId 
 * @param {string} clientSecret 
 * @param {string} refreshToken 
 * @returns {Promise<string>} The new Access Token
 */
function refreshGoogleToken(clientId, clientSecret, refreshToken) {
  return new Promise((resolve, reject) => {
    console.log('🔄 Attempting to refresh Google Access Token...');

    if (!clientId || !clientSecret || !refreshToken) {
      return reject(new Error('Missing required credentials to refresh token (Client ID, Secret, or Refresh Token).'));
    }

    const postData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString();

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            return reject(new Error(response.error_description || response.error));
          }
          
          if (!response.access_token) {
             return reject(new Error('Refresh successful, but no access_token returned.'));
          }

          const newAccessToken = response.access_token;
          console.log('✅ Token refreshed successfully!');

          // Silently write to GitHub Secret Manager
          try {
            updateGithubSecret('GOOGLE_ACCESS_TOKEN', newAccessToken);
          } catch (e) {
            console.warn('⚠️ Could not update secret in GitHub Actions automatically. If running locally, you might need to sync manually. Error:', e.message);
          }

          resolve(newAccessToken);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

module.exports = { refreshGoogleToken };
