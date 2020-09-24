const fetch = require('node-fetch');
var fs = require('fs'); 
const config = require('config');

//Variables you need to configure
var CHANNEL = config.get('channel');
var OAUTH = config.get('token');
var USER = config.get('user');
var TIME_BETWEEN_CALLS = config.get("time_between_calls"); // I recommend 3000

//Variable you _may_ need to modify. This what page you get in the pagination.
//If the job were to fail partway through, you can use the cursor to continue it from where you left off.
var CURSOR = 0;

//Don't modify these, they maintain statuses in the job.
var BUSY = false;
var SCRAPE_DONE = false;
var WRITE_DONE = false;

var MESSAGES = [];

function main() {
    setInterval(() => {
        if(!BUSY && !SCRAPE_DONE){
            batchStep()
        }
        if(SCRAPE_DONE){
            console.log("done");
        }
    }, TIME_BETWEEN_CALLS);
}

function batchStep() {
    BUSY = true;
    callApi(OAUTH, CURSOR, CHANNEL).then(response => {
        //TODO: file write op
        if(response.response_metadata){
            CURSOR = response.response_metadata.next_cursor;
        } else {
            SCRAPE_DONE = true;
            if(!WRITE_DONE){
                fs.appendFile('output.json', JSON.stringify(MESSAGES), function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                  });
                WRITE_DONE=true;
                  
            }
        }
        prepFileWrite(response)
        BUSY = false;
    }).catch(err => {
        console.log(err);

    });

}

function prepFileWrite(response) {
    var messages = response.messages;
    messages.filter(message => message.user === USER); 
    MESSAGES = MESSAGES.concat(messages);
    console.log(MESSAGES);
}

function callApi(auth, cursor, channel) {
    var url = `https://slack.com/api/conversations.history?channel=${channel}&&cursor=${cursor}`;
   
    return fetch(`https://slack.com/api/conversations.history?channel=${channel}&&cursor=${cursor}`, {
        method: 'POST',
        headers: {
            'Authorization': auth
        }
    }).then(res => res.json())
    .catch(err => console.log(err))
}

main()