function postGuess(guess) {
    let form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "/game");

    let hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "guesschar");
    hiddenField.setAttribute("value", guess);

    form.appendChild(hiddenField);
    
    document.body.appendChild(form);
    form.submit();
}

document.querySelector('body').addEventListener('click', function (event) {
    if (event.target.tagName.toLowerCase() === 'button' && event.target.className === 'guesschar') {
        let guess = event.target.innerHTML;
        postGuess(guess);
    }
});
