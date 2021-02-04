'use strict';
import express from 'express';
import ini from 'ini';
import fs from 'fs';
const PORT = process.env.PORT;
// Import the bot configurations
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));

const app = express();

console.log(config.ACCESS_KEY, config.TONCE, config.SIGNATURE, config.SECRET_KEY);

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
    fs.writeFile("./error.txt", Date.now + ": " + error, function (params) {});
}
