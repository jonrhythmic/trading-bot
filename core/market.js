// Namespaces: 
// market:
// store all variables used in this function, and prints out details with market.data(); 
// returns the current marketdetails like current trend and meta (24h volume, 24h changes, top gainers, top loosers) about the exchange user is connected to

const market = {
    cointype: ['stable', 'volatile', 'semivolatile'],
    _exchange: undefined,

    get: function() {
        return this._exchange;
    },
    set: function(value) {
        this._exchange = value;
    },

    /*
        const market = {};

        let exchangeValue = null;

        Object.defineProperties(market, {
            exchange: {
                get() {
                    return exchangeValue;
                },
                set(value) {
                    exchangeValue = value;
                }
            }
        });
        or like this:

        Object.defineProperties(market, {
            _exchange: {
                value: null,
                writable: true,
            },
            exchange: {
                get() {
                    return this._exchange;
                },
                set(value) {
                    this._exchange = value;
                }
            }
        });
    */
    
    // Return the 24h changes for an individual coin
    changes: function(coin) { console.log(`Output the 24h changes for ${coin} in PERCENT`); },
    // Return the 24h volume for an individual exchange in custom currency
    volume: function(currency) { console.log(`Output the 24h volume in ${currency} goes here`); },

    // Generate a trading strategy based on these function
    strategy:  { 
        get: function()  { return `market.strategies() returns here!`; },
        set: function(type) { console.log(`market.strategies() is set to ${type} here!`); }
    },
    // Strategies: 
    // *** Divide the various coins into 'stable' or 'volatile'
    // *** Guestimates: 
    //     - top-5 coins will increase +10% from live price, and drop -15% from top pr week over and over
    //     - low marketcap altcoin will drop -25% and gain +7% from bottom over and over
    //     - popular altcoins will increase 10% and drop -15% and run sideways most of the time
    // *** Type of trader: diversify, maximalist, 
    // *** Per coin type: fish (one of many, small investments), dolphin (pump and dump), whale (tradeintensive highhand, longterm hodler)
    // *** Market strategies: bearish (focus on stablecoins vs diversified trading), bullish (focus on diversifying), sideways ()
    // *** Set a goal for trading and divide into percent to trade pr option: highhand, week, month, 1k (+85% - +100%), 4k (+100% - 1000%). 
    //     Base the percent gained on both increase in coin value and increase in amount hodl'd => bullish more percent of trades on +15% and more, bearish more percent of trades on -25% and more 
    cointype: function() { console.log("Coins are either 'stable', 'volatile (unlimited cap)' or 'semivolatile (fixed cap)'") },
    // setters 
    set tactic(type) {},
    set strategy(type) {},
    // getters 
    get tactic() { return; },
    get strategy() { return; }
}

/* TODO */
// - Longterm project: implement the 5 common trading patterns, and make a pseudo analyzis of what the usual outcome is. Also look at "breakout" patterns, they are probably easy to calculate
// - CME gaps? Are they vital to keep tabs on?
// - Improve the way price handles param: coin
// - Create a function that handles coins that are worth $1 > (eg. Dogecoin) accept prices at .toFixed(8)
// - Make a function that converts price in price(coin) to btc as reference value... (nm use vs_currencies=sats!)

// Object.defineProperties(market, {
//     exchange: {
//         get() { 
//             return `Output the current market details on ${this.exchange}' data!`; 
//         },
//         set(value) { 
//             this.exchange = value; 
//         }
//     }
// });

export default market;