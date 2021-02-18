import express from 'express';
import ini from 'ini';
import fs from 'fs';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { createBrotliDecompress } from 'zlib';
//import * as coins from './data/coins.json';
// import terminate from './core/utils.js';
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
            // Runs no matter what the result comes back as
            // console.log(obj); 
            // console.log(typeof obj);                    // object
            // console.log(obj instanceof Bot);            // true
            // console.log(obj instanceof constructor);    // true
            // If a finally returns a value it becomes the return value of the entire try-catch-finally block regardless of any return from try-catch
            
            fs.readFile('./data/coins.json', (err, coins) => {
                if (err) {
                    console.log(err);
                } else {
                    let coinlist = JSON.parse(coins);
                    let list = [];
                    
                    for (let coin of coinlist) {
                        console.log(coin.name, coin.id);
                    }

                    for (let i of list) {
                        list.fill(list);
                    }
                    console.log(list.length);

                    // EITHER WRITE A FUNCTION THAT TEST fetch(&market="TICKER_1" + "TICKER_2") || fetch(&market=""TICKER_2" + "TICKER_1") === EXISTS?, 
                    // or store the existing market in the coins.js list...
                    //  GET THE REALTIME PRICE OF A COIN USING COINGECKO TO COMPARE YOUR BID PRICE WITH 
                    // IMPLEMENT THE STRATEGY TO BE USED TO DETERMINE WHAT TO DO IN THE BOT (percent gain / lower + current trend: bearish / bullish / sideways / hodl)
                }
            });
            
            return console.log("version <0. 0. 0>", "\x1b[35m", "alpha", "\x1b[0m"); 
            // TODO: Add a versoning system?
        }
    }
    tonce() { return new Date().getTime(); }
    signature(method, uri, pair, side, price, amount) {
        const tonce = this.tonce();
        
        const request = `access_key=${config.ACCESS_KEY}&market=${pair}&price=${price}&side=${side}&tonce=${tonce}&volume=${amount}`;
        const message = `${method}|/webapi/v3/${uri}|` + request;
        const signature = crypto.createHmac('sha256', config.SECRET_KEY).update(message).digest('hex');
                
        return { signature, request };
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
    // Bots mainloop 
    run = async () => {
        try {
            // Iterate the main loop in timed to avoid flooding the API
            setInterval(() => {
                console.log(`Iterated once!`);
            }, 1000);
        }
        finally {
            // Users closing the application
            process.on('SIGTERM', () => { console.log("Exiting 1!") });  
            // User pressing Ctrl + C
            process.on('SIGINT', () => { console.log("Exiting 2!") }); 
            // OS spesific exit 
            process.on('SIGQUIT', () => { console.log("Exiting 3!") });
        }
    };
};

// IIFE bot starting point
(function execute() {
    // Create an instance of a new bot
    const bot = new Bot(config.ACCESS_KEY, config.SECRET_KEY);
    // Determine if bot is configured correctly
    bot.initialize(bot);

    // depth("giobtc", 10, "desc");
    // trades("giobtc");
    //let tonce = bot.tonce();
    //balance("btc", tonce);

    // Testing "buy" order
    // bot.execute_command(
    //     order, 
    //     [
    //         "buy", 
    //         "giobtc", 
    //         0.00000070, 
    //         100
    //     ]
    // );

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
    
    do {
        bot.run();
    } while (0);
    
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

// Utility function to create an order
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

    if (price === "current") {
        // Connect to the API and get current price 
        // Alt. use a thirdparty API and get the realtime price of the ticker, then place a sale at that price
    }

    if (amount === "all") {
        // Dump the coin onto the market
        // Track how much you'll earn compare to what you spent, so you don't lose you money!
    }
    
    return valid ? ({ valid, action, pair, price, amount, method, uri, pair, side }) : valid;    
};

// Fetch all available trading pairs and store it on a list 
function selection(ticker1, ticker2) {
    fetch('https://graviex.net/webapi/v3/markets' + "/" + `${ticker1}${ticker2}`, {
        method: 'GET', 
        body: null,
        header: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(res => console.log(res.attributes.base_unit, res.attributes.quote_unit))
    .catch(err => console.log(err));

    // Fetch available markets on startup and once every 24h
    // Compare the available tickers and pairs with the user defined, in demand tickers / pairs: 
    // ** If a new pair or a new coin the user has selected as in demand, add it a list of in demand coins
    // ** Re-scan the user defined, in demand tickers / pair once every minute and update the list of coins to focus on
    
    /* TODO: 
        - Find a better name for this function 
    */
}

// Display the most recent trades in a spesific pair 
function trades(pair) {
    const url = 'https://graviex.net/webapi/v3/trades_simple';

    fetch(url + `?market=${pair}`, {
        meothod: 'GET',
        body: null, 
        heaeders: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.log(err))
}

// Display the depth on a spesific pair
function depth(pair, limit='', order='') {
    const url = 'https://graviex.net/webapi/v3/depth';
    if (limit !== '') { limit = `&limit=${limit}`; } 
    if (order !== '') { order = `&order=${order}`; } 
    const request = `?market=${pair}${limit}${order}`;

    fetch(url + request, {
        method: 'GET', 
        body: null,
        header: {'Content-Type': 'application/json'}
    }) 
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.log(err));
}

// Delete orders for a spesific ticker or market
function cancel(ticker) {
    // Get the order_book and list the current orders, delete spesific orders based on price and other criterias
    // Based on order, orders and order_book
}

// Display all available coins with positive balance, or spesify a ticker to show available balance
function balance(ticker, tonce) {
    // TODO: Problems getting this.tonce to work.
    // TODO: function returns the last 100 transactions

    const url = 'https://graviex.net/webapi/v3/';
    const uri = 'account/history';
    //const tonce = this.tonce();
    const request = `access_key=${config.ACCESS_KEY}&tonce=${tonce}&currency=${ticker}`; // TODO: limit (default 100), type (withdraw / deposit), from (from date/time), to (to date/time), page (), order_by
    const message = `GET|/webapi/v3/${uri}|` + request;
    const signature = crypto.createHmac('sha256', config.SECRET_KEY).update(message).digest('hex');

    fetch(url + uri + "?" + request + "&signature=" + signature, {
        method: 'GET',
        body: null,
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.log(err));
}

// Error logging
function log(error) {
    fs.writeFile("./error.txt", Date.now + ": " + error, function (params) {} + "\r\n");
}
