const fetch = require('node-fetch');

//Define oxford dictionary API app_key, app_id, and request URL prefix
const app_key = '0a346ee1cf18972d04ecb6d931b1c6ee';
const app_id = '9e895fee';
const word_limit = 500; //Max number of words returned in results
const req_prefix = `https://od-api.oxforddictionaries.com:443/api/v1/wordlist/en/lexicalCategory%3DNoun%2CVerb?`;

//The bottom of a little bit of callback hell, returns json results, or null if there is a timeout or error
let getFetchJSON = function(url, options) {
    return new Promise(function (resolve, reject) {
        //Timeout after 10 seconds
        setTimeout(function () {
            reject(null);
        }, 10000);

        fetch(url, options)
            .then(function (response) {

                if (response.status != 200) {
                    console.log("Error - getFetchJSON() - Could not fetch data given url: " + url + " | query returned: " + response.responseText);
                    reject(null);
                } else {
                    response.json().then(function (results) {
                        console.log(`Info - getFetchJSON() - Fetch to url ${url} returned response:`, results);
                        resolve(results);
                    });
                }
            });
    });
}

let getRandIndex = function(max) {
    return Math.round(Math.random() * max);
}

//Returns a random word from the oxford dictionary
let getWord = function (difficulty) {
    return new Promise(function (resolve, reject) {
        let wordmaxlength = 6;
        let wordminlength = 5;
        switch (difficulty) {
            case "hard":
                wordmaxlength = 20;
                wordminlength = 10;
                break;
            case "medium":
                wordmaxlength = 8;
                wordminlength = 6;
                break;
            default:
                //Easy
                break;
        }

        let req_suffix = encodeURI(`word_length=>${wordminlength-1},<${wordmaxlength+1}&exact=false&limit=${word_limit}`);

        //Define request headers
        let reqHeaders = {
            'Accept': 'application/json',
            'app_id': app_id,
            'app_key': app_key
        }

        let reqOptions = {
            method: 'GET',
            headers: reqHeaders
        };

        let requestUrl = req_prefix + req_suffix;

        //Get random word from oxford dictionary based on length
        getFetchJSON(requestUrl, reqOptions).then((resultJSON) => {
           if(resultJSON != null) {
               if(resultJSON.results != null && resultJSON.results.length > 0) {
                   console.log("Got " + resultJSON.results.length + " word results");
                   let randIndex = getRandIndex(resultJSON.results.length);
                   resolve(resultJSON.results[randIndex]["word"]);
               } else {
                   console.log("Error in getWord(), no results objects returned in JSON response");
                   reject(null);
               }
           } else {
               reject(null);
           }
        });
    });

}

module.exports = getWord;
