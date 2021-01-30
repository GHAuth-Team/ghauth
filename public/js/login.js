(function () {
    document.querySelector("#img-captcha").addEventListener("click", refreshCaptcha);
    function refreshCaptcha() {
        document.querySelector("#img-captcha").src = `/api/captcha?t=${Date.now()}`;
    }

    document.querySelector(".btn-login").addEventListener("click", function () {
        var email = document.querySelector("#inputEmail").value;
        var raw_password = document.querySelector("#inputPassword").value;
        var captcha = document.querySelector("#inputCaptcha").value;
        if (!email || !raw_password || !captcha) {
            toastr["error"]("邮箱/密码/验证码不能为空");
            return;
        }

        if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
            toastr["error"]("输入的邮箱格式不正确");
            return;
        }

        document.querySelector(".btn-login").setAttribute("disabled", "true");
        toastr["info"]("提交中，请稍后...");

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
                        password: password,
                        captcha: captcha
                    }
                    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secret, { iv: iv, padding: CryptoJS.pad.ZeroPadding });
                    postData(encrypted.ciphertext.toString(CryptoJS.enc.Base64));
                } else {
                    throw "传输凭证获取失败";
                }
            })
            .catch(e => {
                toastr["error"](e.responseText);
                document.querySelector(".btn-login").removeAttribute("disabled");
            });
    })

    function postData(data) {
        fetch(`/login`, {
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
                        toastr["error"](json["msg"]);
                        break;
                    case 1000:
                        toastr["success"]("登录成功，2秒后跳转到首页...");
                        setTimeout(function () {
                            location.href = "/"
                        }, 2000);
                        break;
                    default:
                        throw "未知错误";
                }
                refreshCaptcha();
                document.querySelector(".btn-login").removeAttribute("disabled");
            })
            .catch(e => {
                toastr["error"](e.responseText);
                refreshCaptcha();
                document.querySelector(".btn-login").removeAttribute("disabled");
            });
    }
})()