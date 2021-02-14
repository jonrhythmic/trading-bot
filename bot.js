import express from 'express';
import ini from 'ini';
import fs from 'fs';
import crypto from 'crypto';
import fetch from 'node-fetch';
// Import the bot configurations
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));
// Application configurations
const PORT = process.env.PORT;

const app = express();

class Bot {
    constructor(acesss_key, secret_key) {
        this.acesss_key = config.ACCESS_KEY;
        this.secret_key = config.SECRET_KEY;
    }
    // Should this be a getter?
    tonce() { 
        return new Date().getTime(); 
    }
    // Should this be a getter?
    signature() {
        /*
            MAYBE YOU SHOULD TRY THIS NPM PACKAGE INSTEAD???
            https://www.npmjs.com/package/config.ini
        */

        /* 
            let hash = crypto.createHmac('sha256', secret_key).toString('hex');
            let request = `${url}?access_key=${access_key}&tonce=${tonce}&signature=${hash}`;
            return request;
        */
        // request = 'access_key=' + access_key + '&market=giobtc&price=0.000000042&side=sell' + '&tonce=' + epoch_time + '&volume=100.0'
        // message = 'POST|/webapi/v3/orders|' + request
        let url = "https://graviex.net/webapi/v3/orders";
        let access_key = config.ACCESS_KEY;
        let secret_key = config.SECRET_KEY;
        let tonce = this.tonce();
        let market = 'giobtc';
        let price = 0.00000125;
        let amount = 1.0;
        
        let hash = crypto.createHmac('sha256', config.SECRET_KEY).digest('hex');
        let request = `${url}?access_key=${access_key}&tonce=${tonce}&market=${market}&price=${price}&volume=${amount}&signature=${hash}`;
        
        return request;
        // let url = "https://graviex.net/webapi/v3/orders";
        // let access_key = config.ACCESS_KEY;
        // let secret_key = config.SECRET_KEY;
        // let tonce = this.tonce();
        // let request = url + "&access_key=" + access_key + "&tonce=" + tonce;
        // return crypto.createHmac('sha256', config.SECRET_KEY).update(request).digest('hex');
    }
    execute_command() {
        // https://www.npmjs.com/package/node-fetch
        fetch('https://graviex.net/webapi/v3/markets/', {
                method: 'GET', 
                //body: 'body',
                header: {'Content-Type': 'application/json'}
            })
            .then(res => res.json())
            .then(res => console.log(res))
            .catch(error => console.log(error.code, error.message));
    }
    // FIND A BETTER NAME
    query(requestType, uri, extras="", amount="") {
        let url = "https://graviex.net/webapi/v3/" + uri;
        let tonce = this.tonce();
        let signature = this.signature();
        let options; 
        let volume;
        if (extras === "") {
            options = "";
        } 
        else if (extras !== "") {
            options = "&" + extras;
        }
        if (amount === "") {
            volume = "";
        } 
        else if (amount !== "") {
            volume = "&volume=" + amount;
        }
        
        let payload = requestType + " " + url + "?access_key=" + config.ACCESS_KEY + options + "&tonce=" + tonce + volume + "&signature=" + signature;
        console.log(payload);
    }
};

// IIFE bot starting point
(function execute() {
    // Create an instance of a new bot
    let bot = new Bot(config.ACCESS_KEY, config.SECRET_KEY);

    if (!bot) // NOTE: Read up on this !!!
    {
        console.error("Bot failed to execute...");
    } else if (config.ACCESS_KEY === '') 
    {
        console.warn("Config.ini: Missing access_key or wrong access_key");
    } else if (config.SECRET_KEY === '') 
    {
        console.log("Config.ini: " + "%c", "color: red;" + "Missing secret_key or wrong secret_key");
    }

    // Testing that the query function returns something useful
    //bot.query("GET", "markets", "cool=story");
    // request = 'access_key=' + access_key + '&market=giobtc&price=0.000000042&side=sell' + '&tonce=' + epoch_time + '&volume=100.0'
    // message = 'POST|/webapi/v3/orders|' + request
    console.log(config.ACCESS_KEY);
    console.log(config.SECRET_KEY);
    //bot.query("POST", "orders", "market=giobtc&price=0.00000125&side=sell", "1");
    //bot.execute_command();
    let request = bot.signature();
    console.log(request);
    bot.signature();
})();

// Add generic middleware to express
app.use((req, res, next) => {
    next();
});

// NOTE: use these functions instead of the once displayed in the video (for req.body)
app.use(express.urlencoded({extended: false}));
app.use(express.json());
// New syntax for req.header === req.headers

app.get('/', (req, res) => { 
    res.send("Getting root area");
});

app.listen(PORT || 3000);

// Error logging
function log(error) {
    fs.writeFile("./error.txt", Date.now + ": " + error, function (params) {} + "\r\n");
}
