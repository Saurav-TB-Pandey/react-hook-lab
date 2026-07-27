const https = require('https');
const fs = require('fs');
const path = require('path');

async function publishToGitHub(ghToken, releaseNotes) {
  if (!ghToken) {
    console.error('Skipping GitHub Release: Missing GH_TOKEN or GH_PAT');
    return null;
  }

  // Read current version from package.json
  const pkgPath = path.join(__dirname, '..', '..', 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to read package.json:', err.message);
    return null;
  }

  const version = pkg.version;
  const tagName = `v${version}`;

  const postData = JSON.stringify({
    tag_name: tagName,
    target_commitish: 'master',
    name: tagName,
    body: releaseNotes,
    draft: false, // Set to true for safe local testing
    prerelease: false
  });

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/repos/Saurav-TB-Pandey/react-hook-lab/releases',
    method: 'POST',
    headers: {
      'User-Agent': 'React-Hook-Lab-Release-Script',
      'Authorization': `token ${ghToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    console.log(`🚀 Creating Live GitHub Release for ${tagName}...`);
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = JSON.parse(responseBody);
          console.log(`✅ Success! Live release created with AI-generated details.`);
          console.log(`👉 View it here: ${data.html_url}`);
          resolve(data);
        } else {
          console.error(`❌ Failed to create release. Status Code: ${res.statusCode}`);
          console.error(responseBody);
          reject(new Error(`GitHub API Error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  publishToGitHub
};
