let menu_form = document.getElementById('menu-form');
let errorspan = document.getElementById('error');


//menu_form.addEventListener('onsubmit', menuSubmit(event));

//Returns hanging thing's ascii art as string, returns null if invalid
function buildAsciiThing(input) {
    if (input == null || input.length < 1) return null;

    //Split lines into an array
    let lines = input.split('\n');

    //remove empty lines
    for (var i = 0; i < lines.length; i++) {
        //Reg replace all whitespace
        let linetest = lines[i].replace(/\s/g, "");
        if (linetest.length == 0) lines.splice(i, 1);
    }
    
    //Make sure they weren't all empty lines and result is still in threshold
    if (lines.length >= 5 && lines.length <= 15) { //Align and add rope

        //Align rope to first line
        let spacestr = ""
        for (var i = 0; i < lines[0].length; i++) {
            if (lines[0].charAt(i) == ' ') spacestr += ' ';
        }

        //Add rope to top of lines
        lines.reverse();
        lines.push(spacestr + '|');
        lines.push(spacestr + '|');
        lines.reverse();

        return lines.join('\n');
    }

    return null;
}

//Returns value of selected radio button named 'difficulty' given form, returns null if none selected somehow
function getDifficultySelection(form) {
    let value = null;
    let radios = form.elements['difficulty'];
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            value = radios[i].value;
            break;
        }
    }

    return value;
}

//Submits a hidden form given params
function post(url, params) {
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", url);

    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}

$('#menu-form').submit(function(event) {
    //Wait to load the game screen until the game is set up
    event.preventDefault();
    let ascii_input = document.getElementById('ascii-box').value;
    let ascii_art = buildAsciiThing(ascii_input);
    let difficulty = getDifficultySelection(menu_form);
    if (ascii_art != null && difficulty != null) {
        //Post custom form to server with ascii art and difficulty to start game
        let params = {
            ascii_uriencoded: encodeURI(ascii_art),
            difficulty: difficulty
        }
        post('/startgame', params);
    } else if (ascii_art == null) {
        //Tell the user ascii art was invalid
        errorspan.innerHTML = `The ASCII art you submitted was not valid. Try again with a piece between 5 and 50 lines`;
    } else if (difficulty == null) {
        //Not even gonna justify that with a response... if this happens the user is doing it wrong
        return;
    }
});

/*
function formSubmit(submitEvent) {
    let req_body = {
        name: 
    }

    request({
        uri: window.location.href,
        body: name,
        method: "POST"
    }, postResponse)
}

function postResponse(err, response, body) {
    var statusMessage = document.querySelector('.status')
    if (err) return statusMessage.value = err
    statusMessage.value = body
}
*/
