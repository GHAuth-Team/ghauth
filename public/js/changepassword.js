(function () {
    document.querySelector(".btn-changepassword").addEventListener("click", function () {
        var old_password = document.querySelector("#old-password").value;
        var new_password = document.querySelector("#new-password").value;
        var repeat_password = document.querySelector("#repeat-new-password").value;

        if (!old_password || !new_password || !repeat_password) {
            notyf.open({
                type: 'error',
                message: "<b>邮箱</b>/<b>密码</b>/<b>游戏昵称</b>不能为空"
            });
            return;
        }

        if (new_password !== repeat_password) {
            notyf.open({
                type: 'error',
                message: "两次密码输入不一致"
            });
            return;
        }

        document.querySelector(".btn-changepassword").setAttribute("disabled", "true");
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
                    old_password = old_password + "dKfkZh";
                    old_password = CryptoJS.SHA3(old_password);
                    old_password = old_password.toString(CryptoJS.enc.Hex);

                    new_password = new_password + "dKfkZh";
                    new_password = CryptoJS.SHA3(new_password);
                    new_password = new_password.toString(CryptoJS.enc.Hex);
                    var data = {
                        old_password: old_password,
                        new_password: new_password,
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
                document.querySelector(".btn-changepassword").removeAttribute("disabled");
            });
    })

    function postData(data) {
        fetch(`/api/changepassword`, {
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
                            message: "密码修改成功，2秒后刷新..."
                        });
                        setTimeout(function () {
                            location.href = "/"
                        }, 2000);
                        break;
                    default:
                        throw "未知错误";
                }
                document.querySelector(".btn-changepassword").removeAttribute("disabled");
            })
            .catch(e => {
                notyf.open({
                    type: 'error',
                    message: e
                });
                document.querySelector(".btn-changepassword").removeAttribute("disabled");
            });
    }
})()