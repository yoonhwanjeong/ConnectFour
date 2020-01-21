function show() {
    document.getElementById("pop_up_bg").style.display = "block";
}

function closeBox() {
    document.getElementById("pop_up_bg").style.display = "none";
}

(function () {
    let hoursPlayed = false;
    document.getElementById("div_rect3").onclick = () => {
        if (!hoursPlayed) {
            document.getElementById("div_times_visited").style.display = "none";
            document.getElementById("div_hours_played").style.display = "block";
        } else {
            document.getElementById("div_times_visited").style.display = "block";
            document.getElementById("div_hours_played").style.display = "none";
        }
        hoursPlayed = !hoursPlayed;
    };
})();
