(() => {
    Array.from(document.getElementsByClassName("button-with-sound")).forEach(currentValue => {
        currentValue.addEventListener("click", () => {
            new Audio("../data/buttons.wav").play();
        });
    });
})();