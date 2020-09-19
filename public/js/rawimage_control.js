(function () {
    window.refreshRawImage = function () {
        document.querySelector("#rawimage-loading").classList.add("active");
        document.querySelector("#raw-image").src = document.querySelector("#skinData").data.skin;
        setTimeout(function () {
            document.querySelector("#rawimage-loading").classList.remove("active");
        }, 500);
    }
})()