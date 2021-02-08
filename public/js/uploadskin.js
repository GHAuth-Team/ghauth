(function () {
    var skinHandleCanvas = document.createElement("canvas");
    var skinHandleImage = new Image();
    skinHandleImage.onload = function () {
        if (this.width == 64 && (this.height == 64 || this.height == 32)) {
            skinHandleCanvas.width = this.width;
            skinHandleCanvas.height = this.height;
            skinHandleCanvas.getContext('2d').drawImage(this, 0, 0);
            window.URL.revokeObjectURL(this.src);
            document.querySelector("#skinData").data.skinType = parseInt(document.querySelector("input[name='skinUploadTypeRadio']:checked").value);
            document.querySelector("#skinData").data.skin = skinHandleCanvas.toDataURL("image/png");
            window.refreshViewer(false);
        } else {
            window.URL.revokeObjectURL(this.src);
            notyf.open({
                type: 'error',
                message: '皮肤尺寸必须为<b>64*64</b>或<b>64*32</b>'
            });
        }
    }
    
    skinHandleImage.onerror = function () {
        window.URL.revokeObjectURL(this.src);
        notyf.open({
            type: 'error',
            message: '读取皮肤时发生错误'
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        bsCustomFileInput.init()
    });

    document.querySelector("#viewSelectedSkin").addEventListener("click", function () {
        var files = document.querySelector("#skinFileInput").files;
        if (files[0]) {
            var imgsrc = window.URL.createObjectURL(files[0]);
            skinHandleImage.src = imgsrc;
        } else {
            notyf.open({
                type: 'error',
                message: '你还没有选择文件'
            });
        }
    })

    document.querySelector(".btn-uploadskin").addEventListener("click", function () {
        var skinUploadCanvas = document.createElement("canvas");
        var skinUploadImage = new Image();
        skinUploadImage.onload = function () {
            if (this.width == 64 && (this.height == 64 || this.height == 32)) {
                skinUploadCanvas.width = this.width;
                skinUploadCanvas.height = this.height;
                skinUploadCanvas.getContext('2d').drawImage(this, 0, 0);
                window.URL.revokeObjectURL(this.src);
                this.remove();
                postSkinData(skinUploadCanvas);
            } else {
                window.URL.revokeObjectURL(this.src);
                notyf.open({
                    type: 'error',
                    message: '皮肤尺寸必须为<b>64*64</b>或<b>64*32</b>'
                });
            }
        }

        skinUploadImage.onerror = function () {
            window.URL.revokeObjectURL(this.src);
            notyf.open({
                type: 'error',
                message: '读取皮肤时发生错误'
            });
        }


        var files = document.querySelector("#skinFileInput").files;
        if (files[0]) {
            var imgsrc = window.URL.createObjectURL(files[0]);
            skinUploadImage.src = imgsrc;
        } else {
            notyf.open({
                type: 'error',
                message: '你还没有选择文件'
            });
        }
    })

    function postSkinData(canvas) {
        var skinType = parseInt(document.querySelector("input[name='skinUploadTypeRadio']:checked").value);
        var skinData = ""; 
        if (canvas.width != 64 || (canvas.height != 64 && canvas.height != 32)) {
            notyf.open({
                type: 'error',
                message: '皮肤格式错误'
            });
            return;
        }
        try {
            skinData = canvas.toDataURL("image/png");
            skinData = skinData.slice(22);
            canvas.remove();
        } catch (error) {
            console.log(error)
            canvas.remove();
            notyf.open({
                type: 'error',
                message: '皮肤上传错误'
            });
            return;
        }

        if (skinType != 0 && skinType != 1) {
            notyf.open({
                type: 'error',
                message: '皮肤模型选择错误'
            });
            return;
        }



        document.querySelector(".btn-uploadskin").setAttribute("disabled", "true");
        notyf.open({
            type: 'info',
            message: '提交中，请稍后...'
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
                    var data = {
                        type: skinType,
                        skin: skinData,
                    }
                    secret = CryptoJS.enc.Hex.parse(atob(secret + "="));
                    iv = CryptoJS.enc.Hex.parse(atob(iv + "="));
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
                document.querySelector(".btn-uploadskin").removeAttribute("disabled");
            });
    }

    function postData(data) {

        fetch(`/api/uploadskin`, {
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
                            message: "皮肤修改成功"
                        });
                        window.refreshViewer(true);
                        break;
                    default:
                        throw "未知错误";
                }
                document.querySelector(".btn-uploadskin").removeAttribute("disabled");
            })
            .catch(e => {
                notyf.open({
                    type: 'error',
                    message: e
                });
                document.querySelector(".btn-uploadskin").removeAttribute("disabled");
            });
    }
})()