import express from 'express';
'use strict';

const user = {
    name: "Jon Andreas Grenness",
    text: "This is a new response"
};

const app = express();

// NOTE: use these functions instead of the once displayed in the video (for req.body)
app.use(express.urlencoded({extended: false}));
app.use(express.json());
// New syntax for req.header === req.headersY

// Add generic middleware to express
app.use((req, res, next) => {
    next();
});

app.get('/', (req, res) => {    
    res.send("Getting root area");
});

app.get('/profile', (req, res) => {
    res.send("Getting profile!");
});

app.post('/profile', (req, res) => {
    console.log(req.body);
    res.send(user);
});

app.listen(3000);
