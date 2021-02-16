import express from 'express';
import ini from 'ini';
import fs, { chmod } from 'fs';
import crypto, { sign } from 'crypto';
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
    initialize(obj) {
        try {
            // This is not the same as if (!bot instanceof Bot) {} because !bot will be evaluated before instanceof
            if (!(obj instanceof Bot)) { 
                console.error("\x1b[36m", "Bot failed to launch...", "\x1b[0m"); 
            } 
            // Check if bot is configured with access tokens
            else if (config.ACCESS_KEY === '') { 
                console.error("Config.ini:", "\x1b[1m", "Missing or erroneous ACCESS_KEY!", "\x1b[0m"); 
            } 
            else if (config.SECRET_KEY === '') { 
                console.error("Config.ini:", "\x1b[1m", "Missing or erroneous SECRET_KEY!", "\x1b[0m"); 
            } 
            else {
                console.log("Status:", "\x1b[36m", "Graviex trading-bot launched successfully!", "\x1b[0m");
            }
        } catch (error) {
                // Re-throw the error unchanged
                throw error; 
        } finally {
            // Will run no matter what the result comes back as
            // console.log(obj); 
            // console.log(typeof obj);                    // object
            // console.log(obj instanceof Bot);            // true
            // console.log(obj instanceof constructor);    // true
            // If a finally returns a value it becomes the return value of the entire try-catch-finally block regardless of any return from try-catch
            return console.log("version <0. 0. 0>", "\x1b[35m", "alpha", "\x1b[0m"); // TODO: Add a versoning system?
        }
    }
    execute_command(callback, args) { 
        callback.apply(this, args);

        const { action, pair, price, amount } = order(args); // This needs further reading
        let opt1 = action;
        let opt2 = pair;
        let opt3 = price;
        let opt4 = amount; 
        console.log("Returned from execute_command()", action, pair, price, amount);

        // https://www.npmjs.com/package/node-fetch
        // fetch('https://graviex.net/webapi/v3/markets/', {
        //         method: 'GET', 
        //         //body: 'body',
        //         header: {'Content-Type': 'application/json'}
        //     })
        //     .then(res => res.json())
        //     .then(res => console.log(res))
        //     .catch(error => console.log(error.code, error.message));

        // fetch(url + "?" + request + "&signature=" + signature, {
        //     method: 'POST',
        //     body: null,
        //     header: {'Content-Type': 'application/json'}
        // })
        // .then(res => res.json())
        // .then(res => console.log(res))
        // .catch(err => console.log(err));
    }
    tonce() { return new Date().getTime(); }
    signature() {
        const url = "https://graviex.net/webapi/v3/orders";
        const tonce = this.tonce();
        const market = 'giobtc';
        const price = 0.00000125;
        const side = 'sell';
        const amount = 100.0;
        
        const request = `access_key=${config.ACCESS_KEY}&market=${market}&price=${price}&side=${side}&tonce=${tonce}&volume=${amount}`;
        const message = 'POST|/webapi/v3/orders|' + request;
        const signature = crypto.createHmac('sha256', config.SECRET_KEY).update(message).digest('hex');
                
        return signature;
    }
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
    const bot = new Bot(config.ACCESS_KEY, config.SECRET_KEY);
    // Determine if bot is configured correctly
    bot.initialize(bot);

    let request = bot.signature();
    console.log(request);

    bot.execute_command(
        order, 
        [
            "buy", 
            "ethltc", 
            0.0125, 
            0.0025
        ]
    );

    bot.execute_command(
        order, 
        [
            "sell", 
            "bchdoge", 
            "current", 
            "all"
        ]
    );
    
    //bot.order("sell", "giobtc", 0.0000125, 100);

    // There should be a do-while loop here ??
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

// order("buy", "giobtc", 0.0000125, 100)
function order(action, pair, price, amount) {
    console.log("Order:", action, pair, price, amount);
    console.log(typeof action, typeof pair, typeof amount, typeof price);

    return ({ 
        action, 
        pair, 
        price, 
        amount 
    });
}

// Error logging
function log(error) {
    fs.writeFile("./error.txt", Date.now + ": " + error, function (params) {} + "\r\n");
}
