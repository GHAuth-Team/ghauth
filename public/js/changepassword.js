(function () {
    document.querySelector(".btn-changepassword").addEventListener("click", function () {
        var old_password = document.querySelector("#old-password").value;
        var new_password = document.querySelector("#new-password").value;
        var repeat_password = document.querySelector("#repeat-new-password").value;

        if (!old_password || !new_password || !repeat_password) {
            toastr["error"]("邮箱/密码/游戏昵称不能为空");
            return;
        }

        if (new_password !== repeat_password) {
            toastr["error"]("两次密码输入不一致");
            return;
        }

        document.querySelector(".btn-changepassword").setAttribute("disabled", "true");
        toastr["info"]("提交中，请稍后...");
        $.post("/api/genkey")
            .success(function (text) {
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
            .error(function (error) {
                toastr["error"](error.responseText);
                document.querySelector(".btn-changepassword").removeAttribute("disabled");
            });
    })

    function postData(data) {
        $.post("/api/changepassword", { data: data })
            .success(function (json) {
                switch (json["code"]) {
                    case -1:
                        toastr["error"](json["msg"]);
                        break;
                    case 1000:
                        toastr["success"]("密码修改成功，2秒后刷新...");
                        setTimeout(function () {
                            location.href = "/"
                        }, 2000);
                        break;
                    default:
                        throw "未知错误";
                }
            })
            .error(function (error) {
                toastr["error"](error.responseText);
            })
            .complete(function () {
                document.querySelector(".btn-changepassword").removeAttribute("disabled");
            })
    }
})()