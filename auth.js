const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const config = require('config');

const CLIENT_ID = config.get('client_id');
const CLIENT_SECRET = config.get('client_secret');
const REDIRECT_URI = 'https://localhost:3000/callback';
const SCOPES = 'channels:history,channels:read,groups:history,groups:read';

var authUrl = `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&user_scope=${SCOPES}`;

var rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('Opening browser for Slack authorization...');
console.log(`If the browser doesn't open, visit:\n${authUrl}\n`);

var openCmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start' : 'xdg-open';
exec(`${openCmd} "${authUrl}"`);

console.log('After authorizing, Slack will redirect to a URL that fails to load.');
console.log('Copy the "code" parameter from the URL bar and paste it here.\n');
console.log('The URL will look like: https://localhost:3000/callback?code=XXXXX\n');

rl.question('Paste the code here: ', async function (code) {
    code = code.trim();
    console.log('Exchanging code for token...');

    try {
        var response = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
        });
        var data = await response.json();

        if (!data.ok) {
            console.log('OAuth error:', data.error);
            rl.close();
            return;
        }

        var token = data.authed_user && data.authed_user.access_token
            ? 'Bearer ' + data.authed_user.access_token
            : 'Bearer ' + data.access_token;
        var userId = data.authed_user ? data.authed_user.id : 'FILL_IN_YOUR_USER_ID';

        var configDir = path.join(__dirname, 'config');
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir);

        var configPath = path.join(configDir, 'default.json');
        var configData = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            token: token,
            user: userId,
            time_between_calls: 3000
        };

        fs.writeFileSync(configPath, JSON.stringify(configData, null, 4));
        console.log('Token saved to config/default.json');
        console.log('User ID:', userId);
        console.log('You can now run: npm start');
    } catch (err) {
        console.log('Error exchanging code:', err);
    }

    rl.close();
});
