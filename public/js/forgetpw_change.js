(() => {
  function refreshCaptcha() {
    document.querySelector('#img-captcha').src = `/api/captcha?t=${Date.now()}`;
  }

  function postData(data) {
    fetch('', {
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
              message: '密码修改成功，2秒后跳转到登录页...',
            });
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
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
    const rawPassword = document.querySelector('#inputPassword').value;
    const repeatPassword = document.querySelector('#inputRepeatPassword').value;
    const captcha = document.querySelector('#inputCaptcha').value;
    if (!rawPassword || !repeatPassword || !captcha) {
      notyf.open({
        type: 'error',
        message: '<b>密码</b>/<b>验证码</b>不能为空',
      });
      return;
    }

    if (rawPassword !== repeatPassword) {
      notyf.open({
        type: 'error',
        message: '两次密码输入不一致',
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
          let password = `${rawPassword}dKfkZh`;
          password = CryptoJS.SHA3(password);
          password = password.toString(CryptoJS.enc.Hex);
          const data = {
            password,
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
