# About

This is a JS script that collects a user's chat history in a Slack channel and stores it as a JSON list. I built this to collect a set of my messages in a Slack that I participate in so my friend could build an ML-driven speech generation bot. 

Eventually I'd like to improve this by making it a cli tool (never done this before) and making user filtering optional.

I know this is stylistically... questionable (namely the use of global variables concerns me), if you have feedback feel free to create an issue!

# Prereqs

You need a slack app in your slack workspace. In particular, you need to authenticate it to obtain a bearer token so this script can authenticate when it calls Slack's API. You also need a channel ID and a user ID as Slack represents them (i.e. not the channel name, if you call another endpoint that gets a list of channels then pull a page of a channel's messages you can extrapolate these pretty quickly.

The token, the user id and the channel id should be placed in a file called `config.json` that you create (see `fake-config.json` for a template).

The time between calls is also configurable! This is important so you don't get rate limited- I use 3000ms but you can likely make this value smaller. I need to check Slack's documentation to give a more precise value.