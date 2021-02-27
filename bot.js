import express from 'express';
import ini from 'ini';
import fs from 'fs';
import crypto from 'crypto';
import fetch from 'node-fetch';
import market from './core/market.js';
// Import the bot configurations
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));
// Application configurations
const PORT = process.env.PORT;

const app = express();

class Bot {
    // class properties;
    markets = [];
    pairs = [];
    count = 0;

    constructor(acesss_key, secret_key) {
        this.acesss_key = config.ACCESS_KEY;
        this.secret_key = config.SECRET_KEY;
    }
    initialize = async (obj) => {
        try {
            // This is not the same as if (!bot instanceof Bot) {} because !bot will be evaluated before instanceof
            if (!(obj instanceof Bot)) {
                process.stdout.write(`\x1b[36mBot failed to launch...\x1b[0m\n`);
                process.exit(-1);
            }
            // Check if bot is configured with access tokens
            else if (config.ACCESS_KEY === '') {
                process.stdout.write(`\x1b[1mConfig.ini:\x1b[0m Missing or erroneous \x1b[1mACCESS_KEY\x1b[0m!\n`);
                process.exit(-1);
            }
            else if (config.SECRET_KEY === '') {
                process.stdout.write(`\x1b[1mConfig.ini:\x1b[0m Missing or erroneous \x1b[1mSECRET_KEY\x1b[0m!\n`);
                process.exit(-1);
            }
            else {
                process.stdout.write(`Status: \x1b[36mGraviex trading-bot launched successfully!\x1b[0m\n`);
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
                    // Parse all coins from './data/coins.json' in a list
                    let coinlist = JSON.parse(coins);
                    
                    // Iterate over each coin and create a potential market pair
                    // getMarketPairs(list) {}
                    this.pairs = coinlist.flatMap(first => coinlist.map(second => {
                        if (!(first.id === second.id)) {
                            //console.log(`${first.id}${second.id}`);
                            return first.id.toLowerCase() + second.id.toLowerCase();
                        }
                    })).filter(i => i != null);
                    
                    // Run through all trading pairs to detect valid markets
                    for (let elements in this.pairs) {
                        setTimeout(() => {
                            // Match all combinations of ticker pairs for real market pairs from the public API
                            fetch('https://graviex.net//webapi/v3/markets/' + this.pairs[elements] + ".json/", {
                                method: 'GET',
                                body: null,
                                headers: { 'Content-Type': 'application/json' }
                            })
                            // TODO: This sometimes returns as text and returns an error: Unexpected token < in JSON at position 0 { type: 'invalid-json }
                            .then(res => 
                            //     if (res.headers.get('Content-Type') === 'application/json') {
                            //         return await res.json();
                            //     }
                            //     console.log(res.headers);
                            // }
                                 res.json()
                            )
                            .then(res => {
                                if (!(res.error)) {
                                    //this.markets.push("/" + res.attributes.id, res.attributes.base_unit, res.attributes.quote_unit);
                                    
                                    let input = {
                                        'id': res.attributes.id,
                                        'base': res.attributes.base_unit,
                                        'quote': res.attributes.quote_unit 
                                    };
                                    
                                    // This finally works, but pushing data to the writeFile loops through it countless times and adds the 
                                    // current amount of pairs and restarts, adding another iteration with the next one. 
                                    // SOLUTION: place the fs.writeFile outside this function and save it there
                                    this.markets.push(input);

                                    let inputArr = [input].flat();
                                    // let data = JSON.stringify([input], null, 4);

                                    let data = JSON.stringify(this.markets, null, 4);
                                    
                                    //console.log(inputArr);

                                    // TypeError [ERR_INVALID_ARG_TYPE]: The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received an instance of Array
                                    //     at Object.writeFile (fs.js:1436:5)
                                    //     at file:///C:/Grenness/trading-bot/bot.js:124:24
                                    //     at FSReqCallback.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:63:3) {
                                    // code: 'ERR_INVALID_ARG_TYPE'
                                    // }
                                    
                                    // TODO: Needs to add the comma after each input, before a new data is inserted, store all inputs in the same array and pop the final comma!
                                    fs.writeFile('./data/markets.json', data, { flag: 'a' }, (err) => {
                                        if (err) { throw err; }
                                    });

                                    // const dataArr = []; //før loopen
                                    // // Denne kjøres for hver gang input endrer seg.
                                    // dataArr = push({...input}); //i slutten av loopen
                                    
                                    this.count++;
                                    //process.stdout.write(`Total valid markets: ${count}\r`);
                                    console.log(`Total valid markets: ${this.count}\r`);
                                }
                                //process.stdout.write(`Total valid markets: ${count}`);
                            })
                            .catch(err => console.log(err));
                        }, 1000);
                    }
                }
            });
            return process.stdout.write("\x1b[37;1mversion\x1b[0m <0. 0. 0> \x1b[35malpha\x1b[0m\r\n");
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
                headers: {'Content-Type': 'application/json'}
            })
            .then(res => res.json())
            .then(res => console.log(res))
            .catch(err => console.log(err));
        } 
        else if (result.valid === false) {
            console.log("Invalid input params");
        }
    }
    price = async (coin, fiat='') => {
        if (fiat === '') {
            fiat = "usd";
        } 
        
        // Connect to Coingecko API and fetch live price
        fetch('https://api.coingecko.com/api/v3/simple/price' + `?ids=${coin}&vs_currencies=${fiat}`, {
            method: 'GET'
        })
        .then(res => res.json())
        .then(res => {
            console.log("1", coin, "=", res[coin][fiat] + ` ${fiat}`);
            
            let price = res[coin][fiat];
            let result = this.convert(price, coin, fiat);

            // let five = 0.95;
            // let ten = 0.9;
            // let twentyfive = 0.75;
            // let fifty = 0.5;
            // console.log("5% lower", (price * five).toFixed(8));
            // console.log("10% lower", (price * ten).toFixed(8));
            // console.log("25% lower", (price * twentyfive).toFixed(8));
            // console.log("50% lower", (price * fifty).toFixed(8));
        })
        .catch(err => console.log(err));
    }
    progressbar(denominator) {
        // let normalized = (100 / denominator).toFixed(2);
        // return normalized;
    }
    exchangeInfo = async () => {
        fetch('https://api.coingecko.com/api/v3/exchanges/graviex', {
            method: 'GET'
        })
        .then(res => res.json())
        .then(res => { console.log(res); })
        .catch(err => console.log(err));
    }
    convert(price, from, into) {
        let result;
        
        // If price is set in a stablecoin avoid converting
        if (into === 'usd' || into === 'usdt' || into === 'eur') { result = price; } 
        // If coin to convert from isn't in btc
        else if (from !== 'sats' || from !== 'btc' || from !== 'bitcoin') {
            // Converting to btc
            if (into === 'sats' || into === 'btc' || into === 'bitcoin') {
                // Add leading zeros to the result
                result = this.pad(price);
            } 
            // Avoid converting altcoin pairs 
            else if (into !== 'sats' || into !== 'btc' || into !== 'bitcoin') { result = price; }
        }
        return result;
    }
    pad(num) {
        // Remove decimal values behind the comma and return conversion
        return String(num.toFixed(0)).padStart(10, '0.0000000');
    }
    history = async (coin='', limit='') => { 
        let uri = 'trades/history';
        let tonce = this.tonce();
        let market = coin; 
        if (market !== '' && (typeof null || typeof undefined)) { market = `&market=${coin}`; }
        let entries = limit;
        if (limit !== '' && typeof limit !== Number) { entries = `&limit=${limit}`; }
        
        // This is supposed to be trade-id - period=time.now() - 24t? - 1t? - 1min?
        // let time = new Date().getTime().toString();
        // &from=${time}&to=${(time-(60*60*24))}
        // Add timeframe and parse it into 1m, 1h, 1d, 1m, 1y, all!

        const request = `access_key=${config.ACCESS_KEY}${entries}${market}&order_by=desc&tonce=${tonce}`; 
        const message = `GET|/webapi/v3/${uri}|` + request;
        const signature = crypto.createHmac('sha256', config.SECRET_KEY).update(message).digest('hex');
        
        fetch('https://graviex.net/webapi/v3/' + uri + "?" + request + "&signature=" + signature, {
            method: 'GET'
        })
        .then(res => res.json())
        .then(res => console.log(res))
        .catch(err => console.log(err));
    }
    // Bots mainloop 
    run = async () => {
        try {
            // Iterate the main loop in timed steps to avoid flooding the API
            setInterval(() => {
                let type = 'semivolatile';

                switch(type) {
                    // trading pairs vs stablecoins like USDT
                    case 'stable':
                        break;
                    // trading pairs vs crypto with limited max circulation like BTC
                    case 'volatile':
                        break;
                    // trading pairs vs crypto with endless max circulation like DOGE
                    case 'semivolatile':
                        break;
                    default:
                        console.log(`Current iteration yealded x new buy / sells, [...]`);
                }
            }, 1000);
        }
        finally {
            // Users closing the application
            process.on('SIGTERM', () => { console.log("Application closing..."); process.exit(0); });  
            // User pressing Ctrl + C
            process.on('SIGINT', () => { console.log("Process aborting..."); process.exit(0); }); 
            // OS spesific exit 
            process.on('SIGQUIT', () => { console.log("Exiting"); process.exit(0); });
        }
    };
};

// IIFE bot starting point
(function execute() {
    // Create an instance of a new bot
    const bot = new Bot(config.ACCESS_KEY, config.SECRET_KEY);
    // Determine if bot is configured correctly
    bot.initialize(bot);

    bot.price('dogecoin', 'sats');
    bot.price('litecoin', 'usd');
    bot.price('bitcoin-cash', 'ltc');

    do {
        bot.run();

    } while (0);
    
})();

const findMarkets = async () => {

} 

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

    if (action === 'sell') {
        valid = true;
        method = 'POST';
        uri = 'orders';
        side = 'sell';
    } 
    else if (action === 'buy') {
        valid = true;
        method = 'POST';
        uri = 'orders';
        side = 'buy';
    }
    else {
        console.log("Invalid order action");
    }

    if (price === 'current') {
        // Connect to the API and get current price 
        // Alt. use a thirdparty API and get the realtime price of the ticker, then place a sale at that price
    }

    if (amount === 'all') {
        // Dump the coin onto the market
        // Track how much you'll earn compare to what you spent, so you don't lose you money!
    }
    
    return valid ? ({ valid, action, pair, price, amount, method, uri, pair, side }) : valid;    
};

// Fetch all available trading pairs and store it on a list 
function selection(first, second) {
    fetch('https://graviex.net/webapi/v3/markets' + "/" + `${first}${second}`, {
        method: 'GET', 
        body: null,
        headers: {'Content-Type': 'application/json'}
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
        headers: {'Content-Type': 'application/json'}
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
        headers: {'Content-Type': 'application/json'}
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

function onError(err) {
    process.stderr.write(err);
    process.exit(-1);
}