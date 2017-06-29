const express = require('express');
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const session = require('express-session');
const parseurl = require('parseurl');
const getWord = require('./getword.js');
const app = express();

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: true,
    authenticated: false,
    first_run: true,
    running: true,
    solution: 'error' //Solution word
}));

app.use(function (req, res, next) {
    let views = req.session.views;

    if (!views) {
        views = req.session.views = {};
    }

    let pathname = parseurl(req).pathname;

    views[pathname] = (views[pathname] || 0) + 1;

    next();
});

//Returns properly formatted html string for ascii hanging thing to be drawn
function getAsciiDisplay(req) {
    let ascii_decoded = decodeURI(req.session.ascii_uriencoded);
    let missedchars = req.session.missedchars;
    //Stores number of lines to draw
    let lineCt = 2;

    let result = [];
    let lines = ascii_decoded.split('\n');
    
    //Always draw rope (first two lines)
    result.push(lines[0].split(' ').join('&nbsp;'));
    result.push(lines[1].split(' ').join('&nbsp;'));
    
    if (missedchars != null && req.session.solution != null) {
        //Try to increment the number of lines drawn so that the whole thing isn't displayed til game loss
        let line_increment = Math.round(req.session.guesslim/(lines.length-2));
        lineCt += (missedchars.length * line_increment);
    } 

    //Make spaces html space char in remaining lines
    for (var i = 2; i < lineCt && lines[i] != null; i++) result.push(lines[i].split(' ').join('&nbsp;'));
    
    //If it's a lost game, just draw the whole thing
    if(missedchars.length == req.session.guesslim) {
        for(var i = lineCt; i < lines.length; i++) result.push(lines[i].split(' ').join('&nbsp;'));
    }
    console.log("Lines to print:", req.session.solution, lineCt, missedchars);
    console.dir(result);
    //Make newlines <br> tag and return
    return result.join('<br>');
}

//Updates game session currword, returns true if a character matches, false otherwise. Assumes guesschar is not repeated.
function checkGuess(req) {
    let guess = req.body.guesschar.toLowerCase();
    let result = '';
    let currword = req.session.currword;
    let solution = req.session.solution;
    let found = false;
    //Fill in blanks in currword
    for (var i = 0; i < solution.length; i++) {
        if (solution.charAt(i) === guess) {
            result += guess;
            found = true;
        } else result += currword.charAt(i);
    }
    
    req.session.currword = result;

    return found;
}

//Returns an array of all available chars
function getAvailableChars(req) {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let usedchars = req.session.usedchars.join('').toUpperCase();
    let result = [];
    for(var i = 0; i < chars.length; i++) 
        if(usedchars.indexOf(chars.charAt(i)) == -1) result.push(chars.charAt(i));
    
    return result;
}

//Show menu screen
app.get('/', function (req, res) {
    res.render('menu', {});
});

app.post('/startgame', function (req, res) {
    //if (req.session.first_run) {
    if (req.body.ascii_uriencoded && req.body.difficulty) {
        req.session.first_run = false;
        //Set initial session variables (random word, difficulty, guessnum, asciiart) from game menu screen
        req.session.guessnum = 0;
        req.session.difficulty = req.body.difficulty;
        req.session.ascii_uriencoded = req.body.ascii_uriencoded;
        req.session.solution = '';
        req.session.currword = '';
        req.session.usedchars = [];
        req.session.missedchars = [];
        req.session.guesslim = 0;
        req.session.running = true;


        //Wait for solution from getWord and render game screen if no timeout
        getWord(req.session.difficulty).then((result) => {
            if (result != null) {
                req.session.solution = result;
                req.session.guesslim = Math.floor(req.session.solution.length * 1.3);
                req.session.guessesleft = req.session.guesslim;

                //Fill initial currword with blanks
                let blankstr = '';
                for (var i = 0; i < req.session.solution.length; i++) {
                    if(req.session.solution.charAt(i) != ' ')
                        blankstr += '_';
                    else blankstr += ' ';
                }

                req.session.currword = blankstr;

                //console.log("Built game session with vars: ", req.session);

                res.redirect(303, '/game');
            } else {
                console.log("Error generating dictionary word.");
                res.send("Sorry, there was a complete failure somewhere. Please return to the <a href=\"/\">menu</a> and try again.");
            }
        });


    } else {
        //Invalid post
        console.log('Error: Malformed initial post request -- dumping request body:', req.body);
    }
    //} else {
    //console.log('Error: Session variables not established, redirecting to menu screen.');
    //res.redirect(307, '/');
    //}
});

app.get('/game', function (req, res) {
    //Display initial game screen 
    if (req.session && !req.session.first_run) {
        console.log("Initial game session variables: ", req.session);
        let gamevars = {
            ascii_display: getAsciiDisplay(req),
            word_display: req.session.currword,
            guessesleft: req.session.guesslim - req.session.guessnum,
            guesstext: '<span class="guesstext">Choose a letter to guess</span>',
            availablechars: getAvailableChars(req),
            usedchars: []
        };

        res.render('game', gamevars);
    } else {
        console.log('Error: Session variables not established, redirecting to menu screen.');
        res.redirect(303, '/');
    }
});

app.post('/game', function (req, res) {
    if (req.session && !req.session.first_run) {
        let guesschar = req.body.guesschar;
        let gamevars = {
            ascii_display: '',
            word_display: req.session.currword,
            guessesleft: req.session.guesslim - req.session.missedchars.length,
            guesstext: '<span class="guesstext">You guessed wrong. Try again.</span>',
            missedchars: `<span class="missedchars">${req.session.missedchars.join(' ')}</span>`,
            usedchars: req.session.usedchars
        };

        //Make sure character hasn't already been used
        if (!req.session.usedchars.includes(guesschar) && req.session.running) {
            req.session.guessnum = req.session.guessnum + 1;
            req.session.usedchars.push(guesschar);
            gamevars.availablechars = getAvailableChars(req);
            if (checkGuess(req)) {
                //That's a hit
                gamevars.word_display = req.session.currword;
                if (req.session.solution != req.session.currword) {
                    gamevars.guesstext = '<span class="guesstext">That\'s a match!</span>';
                } else {
                    //That's a win, run some animation or something
                    gamevars.guesstext = '<span class="guesstext">You win! <a href="/">Play again?</a></span>';
                    req.session.running = false;
                }
            } else {
                //That's a miss
                req.session.missedchars.push(guesschar);
                gamevars.missedchars = `<span class="missedchars">${req.session.missedchars.join(' ')}</span>`;
                gamevars.guessesleft = gamevars.guessesleft-1;
                if (gamevars.guessesleft != 0) { 
                    gamevars.guesstext = '<span class="guesstext">That\'s a miss.</span>';
                } else {
                    //That's a loss
                    gamevars.guesstext = '<span class="guesstext">You lose! <a href="/">Play again?</a></span>';
                    req.session.running = false;
                }
            }
        } else if(req.session.running) {
            //Tell user they've already used that character
            gamevars.guesstext = '<span class="guesstext">You\'ve already tried that character, guess again</span>';
        } else {
            //Tell the user to just go home
            gamevars.guesstext = '<span class="guesstext">You\'re game is over. <a href="/">Go home.</a></span>';
        }
        
        gamevars.availablechars = getAvailableChars(req);
        gamevars.ascii_display = getAsciiDisplay(req);

        res.render('game', gamevars);

    } else {
        console.log('Error: Session variables not established, redirecting to menu screen.');
        res.redirect(307, '/');
    }
});

app.listen(3000, function () {
    console.log("App started")
});
