const fetch = require('node-fetch');
var fs = require('fs');
const config = require('config');

//Variables you need to configure
var OAUTH = config.get('token');
var USER = config.get('user');
var TIME_BETWEEN_CALLS = config.get("time_between_calls"); // I recommend 3000

var MESSAGES = [];
var CHANNELS = [];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function callApi(auth, endpoint, params) {
    var query = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
    return fetch(`https://slack.com/api/${endpoint}?${query}`, {
        method: 'POST',
        headers: {
            'Authorization': auth
        }
    }).then(res => res.json())
    .catch(err => console.log(err));
}

async function fetchChannels() {
    var channels = [];
    var cursor = '';
    do {
        var params = { limit: 200 };
        if (cursor) params.cursor = cursor;
        var response = await callApi(OAUTH, 'conversations.list', params);
        if (!response.ok) {
            console.log('Error fetching channels:', response.error);
            return [];
        }
        channels = channels.concat(response.channels);
        cursor = response.response_metadata && response.response_metadata.next_cursor ? response.response_metadata.next_cursor : '';
        if (cursor) await sleep(TIME_BETWEEN_CALLS);
    } while (cursor);
    return channels;
}

async function fetchMessagesForChannel(channel) {
    var messages = [];
    var cursor = '';
    do {
        var params = { channel: channel.id };
        if (cursor) params.cursor = cursor;
        var response = await callApi(OAUTH, 'conversations.history', params);
        if (!response.ok) {
            console.log(`Error fetching messages for #${channel.name}:`, response.error);
            return messages;
        }
        var filtered = (response.messages || []).filter(message => message.user === USER);
        messages = messages.concat(filtered);
        cursor = response.response_metadata && response.response_metadata.next_cursor ? response.response_metadata.next_cursor : '';
        if (cursor) await sleep(TIME_BETWEEN_CALLS);
    } while (cursor);
    return messages;
}

async function main() {
    console.log('Fetching channel list...');
    CHANNELS = await fetchChannels();
    console.log(`Found ${CHANNELS.length} channels`);

    for (var i = 0; i < CHANNELS.length; i++) {
        var channel = CHANNELS[i];
        console.log(`[${i + 1}/${CHANNELS.length}] Scraping #${channel.name}...`);
        var messages = await fetchMessagesForChannel(channel);
        console.log(`  Found ${messages.length} messages from user`);
        MESSAGES = MESSAGES.concat(messages);
        await sleep(TIME_BETWEEN_CALLS);
    }

    console.log(`Total messages collected: ${MESSAGES.length}`);
    fs.writeFileSync('output.json', JSON.stringify(MESSAGES, null, 2));
    console.log('Saved to output.json');
}

main();
