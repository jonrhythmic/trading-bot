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
            return console.log("version <0. 0. 0>", "\x1b[35m", "alpha", "\x1b[0m"); 
            // TODO: Add a versoning system?
        }
    }
    execute_command(callback, args) { 
        let result = callback.apply(this, args);
        const url = 'https://graviex.net/webapi/v3/';
        
        if (result.valid === true) {
            let action = result.action;
            let pair = result.pair;
            let price = result.price;
            let amount = result.amount; 
            let method = result.method;
            let uri = result.uri;
            let side = result.side;
            let token = this.signature(method, uri, pair, side, price, amount);
            let request = token.request;
            let signature = token.signature;
            
            fetch(url + uri + "?" + request + "&signature=" + signature, {
                method: method,
                body: null,
                header: {'Content-Type': 'application/json'}
            })
            .then(res => res.json())
            .then(res => console.log(res))
            .catch(err => console.log(err));
        } 
        else if (result.valid === false) {
            console.log("Invalid input params");
        }
    }
    tonce() { return new Date().getTime(); }
    signature(method, uri, pair, side, price, amount) {
        const url = "https://graviex.net/webapi/v3/orders";
        const tonce = this.tonce();
        
        const request = `access_key=${config.ACCESS_KEY}&market=${pair}&price=${price}&side=${side}&tonce=${tonce}&volume=${amount}`;
        const message = `${method}|/webapi/v3/${uri}|` + request;
        const signature = crypto.createHmac('sha256', config.SECRET_KEY).update(message).digest('hex');
                
        return { signature, request };
    }
};

// IIFE bot starting point
(function execute() {
    // Create an instance of a new bot
    const bot = new Bot(config.ACCESS_KEY, config.SECRET_KEY);
    // Determine if bot is configured correctly
    bot.initialize(bot);

    // Testing "buy" order
    bot.execute_command(
        order, 
        [
            "buy", 
            "giobtc", 
            0.00000070, 
            100
        ]
    );

    // Testing "sell" order
    // bot.execute_command(
    //     order, 
    //     [
    //         "sell", 
    //         "giobtc", 
    //         0.00000125, 
    //         100
    //     ]
    // );

    // Testing an "invalid" order
    // bot.execute_command(
    //     order, 
    //     [
    //         "invest", 
    //         "bchdoge", 
    //         "current", 
    //         "all"
    //     ]
    // );
    
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

function order(action, pair, price, amount) {
    let valid = false;
    let method = '';
    let uri = '';
    let side = '';

    if (action === "sell") {
        valid = true;
        method = 'POST';
        uri = 'orders';
        side = 'sell';
    } 
    else if (action === "buy") {
        valid = true;
        method = 'POST';
        uri = 'orders';
        side = 'buy';
    }
    else {
        console.log("Invalid order action");
    }
    
    return valid ? ({ valid, action, pair, price, amount, method, uri, pair, side }) : valid;    
}

// Error logging
function log(error) {
    fs.writeFile("./error.txt", Date.now + ": " + error, function (params) {} + "\r\n");
}
