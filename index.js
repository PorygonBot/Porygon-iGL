//Importing all required libraries for Discord, Showdown, and Google
const fs = require("fs");
const request = require("request");
const ws = require("ws");
const path = require("path");
const http = require("http");
const url = require("url");
const opn = require("open");
const axios = require("axios");
const destroyer = require("server-destroy");
const Discord = require("discord.js");
const getUrls = require("get-urls");

//Constants required to make the program work as intended
const {google} = require("googleapis");
const plus = google.plus("v1");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const {psUsername, psPassword, botToken} = require("./config.json");
const bot = new Discord.Client({disableEveryone: true});

//When the bot is connected and logged in to Discord
bot.on("ready", async () => {
	console.log(`${bot.user.username} is online!`);
	bot.user.setActivity(`PS battles`, {type: "watching"});
});

//This is connection code to the PS server.
const websocket = new ws("ws://34.222.148.43:8000/showdown/websocket");
console.log("Server started!");

//When the server has connected
websocket.on("open", function open() {
	console.log("Server connected!");
});

//array of status moves
const hazards = ["Stealth Rocks", "Toxic Spikes", "Spikes"];
const statuses = ["Toxic", "Burn"];
//This is an array filled with all the data sent to me by the server since the bot has last been started
let dataArr = [];
let statusArr = [];
//when the websocket sends a message
websocket.on("message", async function incoming(data) {
	let realdata = data.split("\n");

	//stuff to do after server connects
	if (data.startsWith("|challstr|")) {
		let nonce = data.substring(10);
		let assertion = await login(nonce);
		//logs in
		websocket.send(`|/trn iGLBot,128,${assertion}|`);
	}
	let p1a = "";
	let p2a = "";
	if (data.startsWith(`|switch|`)) {
		let arr = data.split("|");
		if (data.includes("p1a")) p1a = arr[2];
		else if (data.includes("p2a")) p2a = arr[2];
	}

	let players = [];
	let pokes1 = [];
	let pokes2 = [];
	let killer = "";
	let victim = "";
    let winner = "";
    realdata = realdata.replace(realdata.substring(realdata.indexOf("-supereffective")), realdata.indexOf("-damage"), "");
	for (let line of realdata) {
		dataArr.push(line);
		let linenew = line.substring(1);
		console.log("Line: " + linenew);
		let parts = linenew.split("|");

		//used a move
		//it looks like this: |move|p1a: Manaphy|Ice Beam|p2a: Summer time
		if (linenew.startsWith(`move`))
			if (hazards.includes(parts[2]))
				statusArr.push(
					`${parts[1].substring(5)} used ${
						parts[2]
					} on ${parts[3].substring(5)}`
				);
			//|-status|p2a: Summer time|tox
            else if (linenew.startsWith(`-status`) || 
                    (linenew.startsWith(`-start`) && (linenew.endsWith(`confusion`) || linenew.includes(`perish3`)))
                    ) {
				let arr = dataArr[dataArr.length - 2].substring(1).split("|");
				let placeholder = parts[2].substring(0, 3);
				statusArr.push(`${placeholder === "p2a" ? p2a : p1a} used ${arr[2]} on ${placeholder === "p1a" ? p1a : p2a}`);
			}

		//|player|p2|infernapeisawesome|1|
		if (linenew.startsWith(`player`)) {
			players.push(parts[2]);
			console.log("Players: " + players);
		}

		//|poke|p1|Hatterene, F|
		else if (linenew.startsWith(`poke`)) {
			if (parts[1] === "p1") pokes1.push(parts[2]);
			else if (parts[1] === "p2") pokes2.push(parts[2]);

			console.log("Pokes1: " + pokes1);
			console.log("Pokes2: " + pokes2);
        } 
        else if (linenew.startsWith("faint")) {
            victim = parts[1].substring(5,);
            let prevLinenew = dataArr[dataArr.length - 1];
            
            /**
            * |move|p2a: Smeargle|Explosion|p1a: Grookey
            * |-damage|p1a: Grookey|0 fnt
            * |faint|p2a: Smeargle
            * |faint|p1a: Grookey
             */
            let suicideMoves = [
                "Self-Destruct",
                "Explosion",
                "Final Gambit"
            ];
            if (((prevLinenew.startsWith(`-damage`) && prevLinenew.endsWith(`fnt`)) || 
                (prevLinenew.startsWith(`faint`))) &&
                suicideMoves.includes(dataArr[dataArr.length - 2].substring(1,).split("|")[2])) {
                    killer = dataArr[dataArr.length - 2].substring(1,).split("|")[1].substring(5,);
            }

			//specific types of kills
			else if (prevLinenew.startsWith("-damage")) {
				if (prevLinenew.endsWith("psn")) {
					let poisonMoves = [
						"Baneful Bunker",
						"Cross Poison",
						"Fling",
						"Gunk Shot",
						"Poison Fang",
						"Poison Gas",
						"Poison Jab",
						"Poison Powder",
						"Poison Sting",
						"Poison Tail",
						"Psycho Shift",
						"Sludge",
						"Sludge Bomb",
						"Sludge Wave",
						"Smog",
						"Toxic",
						"Toxic Spikes",
						"Toxic Thread",
						"Twineedle"
					];
					for (let i = statusArr.length - 1; i >= 0; --i) {
						let current = statusArr[i].split(" ");
						if (current[4] === parts[1].substring(5) && poisonMoves.contains(current[2])) {
							killer = current[0];
						}
					}
                } 
                else if (prevLinenew.endsWith("brn")) {
					let burnMoves = [
						"Beak Blast",
						"Blaze Kick",
						"Blue Flare",
						"Ember",
						"Fire Blast",
						"Fire Fang",
						"Fire Punch",
						"Flame Wheel",
						"Flamethrower",
						"Flare Blitz",
						"Fling",
						"Heat Wave",
						"Ice Burn",
						"Inferno",
						"Lava Plume",
						"Psycho Shift",
						"Sacred Fire",
						"Scald",
						"Searing Shot",
						"Shadow Fire",
						"Sizzly Slide",
						"Steam Eruption",
						"Tri Attack",
						"Will-O-Wisp"
					];
					for (let i = statusArr.length - 1; i >= 0; --i) {
						let current = statusArr[i].split(" ");
						if (current[4] === parts[1].substring(5) && burnMoves.contains(current[2])) {
							killer = current[0];
						}
					}
                } 
                else if (prevLinenew.endsWith("confusion") ||prevLinenew.endsWith("recoil")) {
					let otherMoves = [
						"Chatter",
						"Confuse Ray",
						"Confusion",
						"Dizzy Punch",
						"Dynamic Punch",
						"Flatter",
						"Hurricane",
						"Psybeam",
						"Rock Climb",
						"Secret Power",
						"Shadow Panic",
						"Signal Beam",
						"Supersonic",
						"Swagger",
						"Sweet Kiss",
						"Teeter Dance",
						"Water Pulse",
						//the rest of these moves are recoil
						"Brave Bird",
						"Double-Edge",
						"Flare Blitz",
						"Head Charge",
						"Head Smash",
						"High Jump Kick",
						"Jump Kick",
						"Light of Ruin",
						"Shadow End",
						"Shadow Rush",
						"Steel Beam",
						"Struggle",
						"Submission",
						"Take Down",
						"Volt Tackle",
						"Wild Charge",
						"Wood Hammer"
					];
					for (let i = statusArr.length - 1; i >= 0; --i) {
						let current = statusArr[i].split(" ");
						if (current[4] === parts[1].substring(5) &&otherMoves.contains(current[2])) {
							killer = current[0];
						}
					}
                } 
                //regular deaths
                else {
					let current;
					if (dataArr[dataArr.length - 2].startsWith(`|-supereffective|`))
						current = dataArr[dataArr.length - 3];
					else current = dataArr[dataArr.length - 2];

					let currentParts = current.substring(1).split("|");
					killer = currentParts[1].substring(5,);
				}
			}
            //this if statement is for things like destiny bond, explosion, and stuff
            /**
            * |-activate|p2a: Drifloon|move: Destiny Bond
            * |faint|p1a: Shedinja
            */
			else if (prevLinenew.startsWith("-activate")) {
                let prevParts = prevLinenew.substring(1,).split("|");
                if (prevParts[2].endsWith(`Destiny Bond`)) {
                    killer = prevParts[1].substring(5,);
                }
            }
            
            /**
            * |-start|p2a: Big Iron|perish0
            * |upkeep
            * |faint|p2a: Big Iron
             */
            else if (dataArr[dataArr.length - 2].startsWith(`|-start|`)) {
                if (dataArr[dataArr.length - 2].endsWith(`perish0`)) {
					for (let i = statusArr.length - 1; i >= 0; --i) {
						let current = statusArr[i].split(" ");
						if (current[4] === parts[1].substring(5) && current[2] === `Perish Song`) {
							killer = current[0];
						}
					}
                }
            }
		}

		//|win|infernapeisawesome
		else if (linenew.startsWith(`win`)) {
			winner = parts[1];
			console.log(winner + " won!");
			dataArr = [];
			statusArr = [];
		}
	}
});

//When a message gets sent on Discord in the channel
bot.on("message", async message => {
	let channel = message.channel;

	if (message.author.bot) return;

	if (channel.type === "dm") return;
	else if (
		channel.id === "658057669617254411" ||
		channel.id === "658058064154329089" ||
		channel.id === "657647109926813708"
	) {
		//separates given message into its parts
		let msgStr = message.content;
		let urls = Array.from(getUrls(msgStr)); //This is because getUrls returns a Set
		let battleLink = urls[0]; //http://sports.psim.us/battle-gen8legacynationaldex-17597 format

		//joins the battle linked
		channel.send(`Joining the battle...`);
		websocket.send(`|/join ${battleLink.substring(22)}`);
		channel.send(`Battle joined! Keeping track of the stats now.`);
		websocket.send(
			`${battleLink.substring(22)}|Battle joined! Keeping track of the stats now.`
		);
	}
});
//making the bot login
bot.login(botToken);

async function login(nonce) {
	let psUrl = "https://play.pokemonshowdown.com/action.php";
	let data = {
		act: "login",
		name: psUsername,
		pass: psPassword,
		challstr: nonce
	};

	let response = await axios.post(psUrl, data);
	let json = JSON.parse(response.data.substring(1));
	console.log("Logged in to PS.");
	return json.assertion;
}