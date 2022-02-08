(() => {
  function refreshCaptcha() {
    document.querySelector('#img-captcha').src = `/api/captcha?t=${Date.now()}`;
  }

  function postData(data) {
    fetch('/forgetpw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(data)}`,
    })
      .then((result) => result.json())
      .then((json) => {
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
              message: '邮件已发送，有效期5分钟，请查收',
            });
            break;
          default:
            throw new Error('未知错误');
        }
        refreshCaptcha();
        document.querySelector('.btn-forgetpw').removeAttribute('disabled');
      })
      .catch((e) => {
        notyf.open({
          type: 'error',
          message: e,
        });
        refreshCaptcha();
        document.querySelector('.btn-forgetpw').removeAttribute('disabled');
      });
  }

  document.querySelector('#img-captcha').addEventListener('click', refreshCaptcha);

  document.querySelector('.btn-forgetpw').addEventListener('click', () => {
    const email = document.querySelector('#inputEmail').value;
    const captcha = document.querySelector('#inputCaptcha').value;
    if (!email || !captcha) {
      notyf.open({
        type: 'error',
        message: '<b>邮箱</b>/<b>验证码</b>不能为空',
      });
      return;
    }

    if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
      notyf.open({
        type: 'error',
        message: '输入的邮箱格式不正确',
      });
      return;
    }

    document.querySelector('.btn-forgetpw').setAttribute('disabled', 'true');
    notyf.open({
      type: 'info',
      message: '提交中，请稍后...',
    });

    fetch('/api/genkey', { method: 'POST' })
      .then((result) => result.text())
      .then((text) => {
        if (text.length === 86) {
          let secret = '';
          let iv = '';
          for (let i = 0; i < text.length; i += 1) {
            if (i % 2 === 0) {
              secret += text[i];
            } else {
              iv += text[i];
            }
          }

          secret = CryptoJS.enc.Hex.parse(atob(`${secret}=`));
          iv = CryptoJS.enc.Hex.parse(atob(`${iv}=`));
          const data = {
            email,
            captcha,
          };
          const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secret, { iv, padding: CryptoJS.pad.ZeroPadding });
          postData(encrypted.ciphertext.toString(CryptoJS.enc.Base64));
        } else {
          throw new Error('传输凭证获取失败');
        }
      })
      .catch((e) => {
        notyf.open({
          type: 'error',
          message: e,
        });
        document.querySelector('.btn-forgetpw').removeAttribute('disabled');
      });
  });
})();
