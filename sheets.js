// [START main_body]
const { google } = require("googleapis");
const express = require("express");
const opn = require("open");
const path = require("path");
const fs = require("fs");

const keyfile = path.join(__dirname, "client_secret.json");
const keys = JSON.parse(fs.readFileSync(keyfile));
const scopes = [
    'https://www.googleapis.com/auth/spreadsheets'
];

// Create an oAuth2 client to authorize the API call
const client = new google.auth.OAuth2(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0]
);

// Generate the url that will be used for authorization
let authorizeUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: scopes
});

// Open an http server to accept the oauth callback. In this
// simple example, the only request to our webserver is to
// /oauth2callback?code=<code>
const app = express();
app.get("/oauth2callback", (req, res) => {
    const code = req.query.code;
    client.getToken(code, (err, tokens) => {
        if (err) {
            console.error("Error getting oAuth tokens:");
            throw err;
        }
        client.credentials = tokens;
        res.send("Authentication successful! Please return to the console.");
        server.close();
        //listMajors(client); is an example of how you'd call the actual sheets function
    });
});

const server = app.listen(3000, () => {
    // open the browser to the authorize url to start the workflow
    opn(authorizeUrl, { wait: false });
});

//Sheets function to do TODO something or other
const sheets = google.sheets({
    version: 'v4',
    auth: client
});
function getTableId(showdownName) {
    //"showdownName":"SHEETNAME"
    const majors = {
        "beastnugget35":"DS",
        "e24mcon":"BBP",
        "":"LLL",
        "":"JDMR",
        "SpooksLite":"DTD",
        "Talal_23":"SoF",
        "":"TDD",
        "":"USD",
        "CinnabarCyndaquil":"CCQ",
        "":"ELA",
        "Vienna Vullabies":"VVB",
        "":"ORR",
        "":"MCM",
        "":"NYP",
        "":"Lani",
        "":"PPK"
    }
    const minors = {
        "GableGames":"MWM",
        "russian runerussia":"RRG",
        "":"LVL",
        "":"LSS",
        "":"UUB",
        "":"CKM",
        "mexicanshyguy":"ARD",
        "":"DDL",
        "joey34":"DSY",
        "":"G4E",
        "":"KCC",
        "":"WOW",
        "":"ETD",
        "infernapeisawesome":"SSR",
        "metsrule97":"HT",
        "":"BBF",
        "":"MMT",
        "":"GRG"
    }
    //finding out the name of the Table as well as if the league is Minors or Majors
    let tableName = "";
    let isMajor = false;
    if (majors[showdownName]) {
        isMajor = true;
        tableName = majors[showdownName];
    }
    else if (minors[showdownName]) {
        isMajor = false;
        tableName = minors[showdownName];
    }
    else {
        return "Invalid Showdown name";
    }

    //Gets info about the sheet
    let sheetsJson = sheets.get({
        "spreadsheetId": "1U85VJem_HDDXNCTB8954R1oCs9-ls6W0Micn2q6P-kE",
        "includeGridData":false
    })
    .then(function(response) {
        // Handle the results here (response.result has the parsed body).
        console.log("Response", response);
    },
    function(err) { 
        console.error("Execute error", err); 
    });
}
// [END main_body]