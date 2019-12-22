//Importing all required libraries for Discord, Showdown, and Google
const fs = require('fs');
const request = require("request");
const ws = require("ws");
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('open');
const axios = require('axios')
const destroyer = require('server-destroy');
const Discord = require('discord.js');
const getUrls = require('get-urls');

//Constants required to make the program work as intended
const {google} = require('googleapis');
const plus = google.plus('v1');
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const {psUsername, psPassword, botToken} = require('./config.json');
const bot = new Discord.Client({disableEveryone: true});

//When the bot is connected and logged in to Discord
bot.on("ready", async () => {
    console.log(`${bot.user.username} is online!`);
    bot.user.setActivity(`PS battles`, {type: "watching"});
});

//This is connection code to the PS server.
const websocket = new ws("ws://34.222.148.43:8000/showdown/websocket");
console.log("Server started!")

//When the server has connected
websocket.on('open', function open() {
    console.log("Server connected!");
});

//This is an array filled with all the data sent to me by the server since the bot has last been started
let dataArr = [];
//when the websocket sends a message 
websocket.on('message', async function incoming(data) {
    let realdata = data.split("\n");

    //stuff to do after server connects
    if (data.startsWith('|challstr|')) {
        let nonce = data.substring(10, );
        let assertion = await login(nonce);
        //logs in
        websocket.send(`|/trn iGLBot,128,${assertion}|`);
    }

    let players = [];
    let pokes1 = [];
    let pokes2 = [];
    let killer = "";
    let victim = "";
    let winner = "";
    for (let line of realdata) {
        dataArr.push(line);
        let linenew = line.substring(1, );
        let parts = linenew.split("|");

        //|player|p2|infernapeisawesome|1|
        if (linenew.startsWith(`player`)) {
            players.push(parts[2]);
            console.log("Players: " + players);
        }

        //|poke|p1|Hatterene, F|
        else if (linenew.startsWith(`poke`)) {
            if (parts[1] === "p1") {
                pokes1.push(parts[2]);
            }
            else if (parts[1] === "p2") {
                pokes2.push(parts[2]);
            }
            console.log("Pokes1: " + pokes1);
            console.log("Pokes2: " + pokes2);
        }

        /**
         *  |move|p1a: Vaporeon|Scald|p2a: Tyranitar
         *  |-supereffective|p2a: Tyranitar
         *  |-damage|p2a: Tyranitar|0 fnt
         *  |faint|p2a: Tyranitar 
        */
        else if (linenew.startsWith(`-danger`) && linenew.endsWith(`0 fnt`)) {
            killer = dataArr[dataArr.length - 3].substring(1,).split("|")[1].substring(5,);
            victim = dataArr[dataArr.length - 3].substring(1,).split("|")[3].substring(5,);
            console.log(killer + " killed " + victim);
        }

        //|win|infernapeisawesome
        else if (linenew.startsWith(`win`)) {
            winner = parts[1];
            //websocket.send(`|/leave`)
            console.log(winner + " won!");
        }
    }
});

//When a message gets sent on Discord in the channel
bot.on("message", async message => {
    let channel = message.channel;

    if (message.author.bot) return;

    if (channel.type === "dm") return;
    else if (channel.id === "658057669617254411" || channel.id === "658058064154329089"
            || channel.id === "657647109926813708") {
        //separates given message into its parts
        let msgStr = message.content;
        let urls = Array.from(getUrls(msgStr)); //This is because getUrls returns a Set
        let battleLink = urls[0]; //http://sports.psim.us/battle-gen8legacynationaldex-17597 format
    
        //joins the battle linked
        channel.send(`Joining the battle...`);
        websocket.send(`|/join ${battleLink.substring(22,)}`);
        channel.send(`Battle joined! Keeping track of the stats now.`)
        websocket.send(`${battleLink.substring(22,)}|Battle joined! Keeping track of the stats now.`)
    }
});
//making the bot login
bot.login(botToken);

async function login(nonce) {
    let psUrl = "https://play.pokemonshowdown.com/action.php";
    let data = {
        'act':"login",
        'name': psUsername,
        'pass': psPassword,
        'challstr': nonce
    };

    let response = await axios.post(psUrl, data)
    let json = JSON.parse(response.data.substring(1,))
    console.log("Logged in to PS.");
    return json.assertion
}