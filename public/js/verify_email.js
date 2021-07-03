(() => {
    let verifyEmailBtn = document.querySelector(".btn-verifyemail");
    verifyEmailBtn.addEventListener("click", () => {
        console.log(1)
        verifyEmailBtn.setAttribute("disabled", "disabled");
        fetch("./api/sendverifyemail")
            .then(ret => ret.json())
            .then(json => {
                switch (json.code) {
                    case -1:
                        notyf.open({
                            type: 'error',
                            message: json.msg,
                        });
                        break;
                    case 1000:
                        notyf.open({
                            type: 'success',
                            message: json.msg,
                        });
                        break;
                    default:
                        notyf.open({
                            type: 'error',
                            message: '未知错误',
                        });
                }
                verifyEmailBtn.removeAttribute("disabled");
            })
            .catch(() => {
                notyf.open({
                    type: 'error',
                    message: '未知错误',
                });
                verifyEmailBtn.removeAttribute("disabled");
            })
    })
})()