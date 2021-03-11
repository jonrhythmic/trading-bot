import ini from 'ini';
import fs from 'fs';
import crypto from 'crypto';
import fetch from 'node-fetch';
import market from './core/market.js';
// Import the bot configurations
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));

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
    // Display all available coins with positive balance, or spesify a ticker to show available balance
    balance(coin='') {
        const url = 'https://graviex.net/webapi/v3/';
        const uri = 'members/me';
        const tonce = this.tonce();
        const ticker = coin;

        //if (coin !== '') { coin = `${ticker}`};
    
        const request = `access_key=${config.ACCESS_KEY}&tonce=${tonce}`;
        const message = `GET|/webapi/v3/${uri}|` + request;
        const signature = crypto.createHmac('sha256', config.SECRET_KEY).update(message).digest('hex');

        // res.accounts_filtered[0].balance to get the balance of the first object in the list
        // Yea then u need to iterate through every element in the list and check if the coin is called ltc
        fetch(url + uri + "?" + request + "&signature=" + signature, {
            method: 'GET'
        })
        .then(res => res.json())
        .then((res) => {
            // TODO: Add the possibility to select a custom coin, other list every coin with positive balance
            res.accounts_filtered.forEach(element => {
                if (coin !== '' && element.currency === coin) {
                    console.log("Currency:", element.currency.toUpperCase(), "\nAvailable balance:", element.balance, element.currency.toUpperCase(), "\nCoins in order:", element.locked, element.currency.toUpperCase());
                } 
                else if (coin === '') {
                    if (element.balance > 0.0) {
                        console.log("Currency:", element.currency.toUpperCase(), "Available balance:", element.balance, element.currency.toUpperCase(), "Coins in order:", element.locked, element.currency.toUpperCase());
                    }
                }
            });
        }) 
        .catch(err => console.log(err));
    }
    price = async (coin, fiat='') => {
        if (fiat === '' && fiat !== typeof String) {
            fiat = "usd";
        } 
        // Connect to Coingecko API and fetch live price
        const request = await fetch('https://api.coingecko.com/api/v3/simple/price' + `?ids=${coin}&vs_currencies=${fiat}`, {
            method: 'GET',
            body: null,
            headers: {'Content-Type': 'application/json'}
        });

        if (request.ok) {
            const response = await request.json();

            console.log("1", coin, "=", response[coin][fiat] + ` ${fiat}`);
            
            try {
                let price = response[coin][fiat];
                console.log(price);
                let result;

                // Test if the price is lower than e-6 (js will convert that to scientific notation)
                if (price < 0.000001) {
                    // Convert small numbers into real numbers
                    result = this.convertENotationToNumber(price);
                } else {
                    // Otherwise test if number needs to be converted by adding leading zeros
                    result = this.convert(price, coin, fiat);
                }
                
                // let five = 0.95;
                // let ten = 0.9;
                // let twentyfive = 0.75;
                // let fifty = 0.5;
                // console.log("5% lower", (price * five).toFixed(8));
                // console.log("10% lower", (price * ten).toFixed(8));
                // console.log("25% lower", (price * twentyfive).toFixed(8));
                // console.log("50% lower", (price * fifty).toFixed(8));
                return result;
            }
            catch (error) { 
                console.log("Unable to retreive price!"); 
            }
        } else {
            console.log("Unable to connect to coingecko' API!");
        }
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
    convertENotationToNumber(num) {
        // Thanks to u/iguessitsokaythen for this helping with this methid
        const str = num.toString()
        const match = str.match(/^(\d+)(\.(\d+))?[eE]([-\+]?\d+)$/)
        if (!match) return str //number was not e notation or toString converted
        // we parse the e notation as (integer).(tail)e(exponent)
        const [, integer,, tail, exponentStr ] = match
        const exponent = Number(exponentStr)
        const realInteger = integer + (tail || '')
        if (exponent > 0) {
            const realExponent = Math.abs(exponent + integer.length)
            return realInteger.padEnd(realExponent, '0')
        } else {
            const realExponent = Math.abs(exponent - (tail?.length || 0))
            return '0.'+ realInteger.padStart(realExponent, '0')
        }
    }
    history = async (coin='', limit='') => { 
        let uri = 'trades/history';
        let tonce = this.tonce();
        let market = coin; 
        if (market !== '' && (typeof null || typeof undefined)) { market = `&market=${coin}`; }
        let entries = limit;
        if (limit !== '' && typeof limit !== Number) { entries = `&limit=${limit}`; }
        const time = Math.floor(Date.now() / 1000) + '000'; // Must be spesified in time since 1.1.1970 + adding three trailing zeros
        
        // This is supposed to be trade-id - period=time.now() - 24t? - 1t? - 1min?
        // let time = new Date().getTime().toJSON(); Must be spesified in time since 1.1.1970
        // &from=${time-(60*60*24)}&to=${(time)} / &to=${(time)}&from=${time-(60*60*24)} // 
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
    findMarkets = async () => {
        fs.readFile('./data/coins.json', (err, coins) => {
            if (err) {
                console.log(err);
            } else {
                // Parse all coins from './data/coins.json' in a list
                let coinlist = JSON.parse(coins);

                // Iterate over each coin and create a potential market pair
                this.pairs = coinlist.flatMap(first => coinlist.map(second => {
                    if (!(first.id === second.id)) {
                        //console.log(`${first.id}${second.id}`);
                        return first.id.toLowerCase() + second.id.toLowerCase();
                    }
                })).filter(i => i != null);

                // Run through all trading pairs to detect valid markets
                this.pairs.forEach (async (pair) => {
                    const request = await fetch('https://graviex.net//webapi/v3/markets/' + pair + ".json/", {
                        method: 'GET',
                        body: null,
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (request.ok && request.headers.get('Content-Type') === 'application/json') {
                        const response = await request.json();

                        try {
                            let input = {
                                'id': response.attributes.id,
                                'base': response.attributes.base_unit,
                                'quote': response.attributes.quote_unit 
                            };
                            this.markets.push(input);
                            let data = JSON.stringify(this.markets, null, 4);
                            
                            fs.writeFileSync('./data/markets.json', String(data), /* { flag: 'a' }, */ (err) => {
                                if (err) { throw err; }
                            });

                        }
                        catch (error) {
                            console.log(error);
                        }
                    } 
                });
            } 
        });
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
    // Generate a list of existing markets
    bot.findMarkets();
    
    //bot.balance('usdt');

    bot.price('dogecoin', 'sats');
    bot.price('graviocoin', 'btc');
    bot.price('bitcoin-cash', 'ltc');
    
    bot.execute_command(
        order,
        [
            "sell",
            "giobtc",
            "current",
            100
        ]
    );

    do {
        bot.run();
    } while (0);
    
})();

// Utility function to create an order
async function order(action, pair, price, amount) {
    // GET /webapi/v3/orders market=all	Ability to get all placed orders for all markets - can be user to parse out the results you need to handle

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
        let base; 
        let quote;

        // Read through markets.json and send the base / quote into the price function.
        const list = fs.readFileSync('./data/markets.json');
        const coins = JSON.parse(list);

        // convert the pair into two tickers
        coins.forEach(coin => {
            if (pair === coin.id) {
                // Create a lookup for the name on coingecko to be able to use price function
                const ticker = fs.readFileSync('./data/coingecko.json');
                const names = JSON.parse(ticker);
                
                // Find the base / quote price ratio
                names.forEach(ticker => {
                    // Find the correct name for from-value to send to coingecko' price API 
                    try {
                        if (coin.base === ticker.symbol) {
                            // console.log("Base", ticker.id);
                            // Check if the base name contains spaces
                            if (/\s/.test(base)) {
                                base = base.replace('/ /g', '-');
                            }
                            base = ticker.id;
                        }
                        // Find the correct ticker for in-value to send to coingecko' price API
                        if (coin.quote === ticker.symbol) {
                            // console.log("Quote", ticker.symbol);
                            quote = ticker.symbol;
                        }
                    }
                    catch (error) {
                        console.log("Ran into an error!");
                    }
                });
            }
        });
        // Send the values to coingecko to extract the correct price
        if (base !== undefined && quote !== undefined) {
            price = await this.price(base, quote);
        }
    }

    if (amount === 'all') {
        // Dump the coin onto the market
        // Track how much you'll earn compare to what you spent, so you don't lose you money!
    }
    
    return valid ? ({ valid, action, pair, price, amount, method, uri, pair, side }) : valid;    
};

// Display the most recent trades in a spesific pair 
function trades(pair) {
    const url = 'https://graviex.net/webapi/v3/trades_simple';

    fetch(url + `?market=${pair}`, {
        method: 'GET',
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
function balance01(ticker, tonce) {
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