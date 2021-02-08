(function () {
    document.querySelector("#img-captcha").addEventListener("click", refreshCaptcha);
    function refreshCaptcha() {
        document.querySelector("#img-captcha").src = `/api/captcha?t=${Date.now()}`;
    }
    document.querySelector(".btn-register").addEventListener("click", function () {
        var email = document.querySelector("#inputEmail").value;
        var playername = document.querySelector("#inputPlayerName").value;
        var raw_password = document.querySelector("#inputPassword").value;
        var repeat_password = document.querySelector("#inputRepeatPassword").value;
        var captchaCode = document.querySelector("#inputCaptcha").value;
        if (!captchaCode) {
            notyf.open({
                type: 'error',
                message: "验证码不能为空"
            });
            return;
        }

        if (!email || !raw_password || !playername || !repeat_password) {
            notyf.open({
                type: 'error',
                message: "<b>邮箱</b>/<b>密码</b>/<b>游戏昵称</b>不能为空"
            });
            return;
        }

        if (raw_password !== repeat_password) {
            notyf.open({
                type: 'error',
                message: "两次密码输入不一致"
            });
            return;
        }

        if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
            notyf.open({
                type: 'error',
                message: "输入的邮箱格式不正确"
            });
            return;
        }

        if (!/^[A-Za-z0-9_]+$/.test(playername) || playername.length < 4 || playername.length > 12) {
            notyf.open({
                type: 'error',
                message: "输入的游戏昵称不合法"
            });
            return;
        }

        document.querySelector(".btn-register").setAttribute("disabled", "true");
        notyf.open({
            type: 'info',
            message: "提交中，请稍后..."
        });
        fetch(`/api/genkey`, { method: 'POST' })
            .then(result => result.text())
            .then(text => {
                if (text.length == 86) {
                    var secret = "";
                    var iv = "";
                    for (var i = 0; i < text.length; i++) {
                        if (i % 2 == 0) {
                            secret += text[i];
                        } else {
                            iv += text[i];
                        }
                    }

                    secret = CryptoJS.enc.Hex.parse(atob(secret + "="));
                    iv = CryptoJS.enc.Hex.parse(atob(iv + "="));
                    var password = raw_password + "dKfkZh";
                    password = CryptoJS.SHA3(password);
                    password = password.toString(CryptoJS.enc.Hex);
                    var data = {
                        email: email,
                        playername: playername,
                        password: password,
                        captcha: captchaCode
                    }
                    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secret, { iv: iv, padding: CryptoJS.pad.ZeroPadding });
                    postData(encrypted.ciphertext.toString(CryptoJS.enc.Base64));
                } else {
                    throw "传输凭证获取失败";
                }
            })
            .catch(e => {
                notyf.open({
                    type: 'error',
                    message: e
                });
                document.querySelector(".btn-register").removeAttribute("disabled");
            });
    })

    function postData(data) {
        fetch(`/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `data=${encodeURIComponent(data)}`
        })
            .then(result => result.json())
            .then(json => {
                switch (json["code"]) {
                    case -1:
                        notyf.open({
                            type: 'error',
                            message: json["msg"]
                        });
                        break;
                    case 1000:
                        notyf.open({
                            type: 'success',
                            message: "注册成功，2秒后跳转到首页..."
                        });
                        setTimeout(function () {
                            location.href = "/"
                        }, 2000);
                        break;
                    default:
                        throw "未知错误";
                }
                refreshCaptcha();
                document.querySelector(".btn-register").removeAttribute("disabled");
            })
            .catch(e => {
                notyf.open({
                    type: 'error',
                    message: e
                });
                refreshCaptcha();
                document.querySelector(".btn-register").removeAttribute("disabled");
            });
    }
})()