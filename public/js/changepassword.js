(() => {
  function postData(data) {
    fetch('/api/changepassword', {
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
              message: '密码修改成功，2秒后刷新...',
            });
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            break;
          default:
            throw new Error('未知错误');
        }
        document.querySelector('.btn-changepassword').removeAttribute('disabled');
      })
      .catch((e) => {
        notyf.open({
          type: 'error',
          message: e,
        });
        document.querySelector('.btn-changepassword').removeAttribute('disabled');
      });
  }

  document.querySelector('.btn-changepassword').addEventListener('click', () => {
    let oldPassword = document.querySelector('#old-password').value;
    let newPassword = document.querySelector('#new-password').value;
    const repeatPassword = document.querySelector('#repeat-new-password').value;

    if (!oldPassword || !newPassword || !repeatPassword) {
      notyf.open({
        type: 'error',
        message: '<b>邮箱</b>/<b>密码</b>/<b>游戏昵称</b>不能为空',
      });
      return;
    }

    if (newPassword !== repeatPassword) {
      notyf.open({
        type: 'error',
        message: '两次密码输入不一致',
      });
      return;
    }

    document.querySelector('.btn-changepassword').setAttribute('disabled', 'true');
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
          oldPassword += 'dKfkZh';
          oldPassword = CryptoJS.SHA3(oldPassword);
          oldPassword = oldPassword.toString(CryptoJS.enc.Hex);

          newPassword = `${newPassword}dKfkZh`;
          newPassword = CryptoJS.SHA3(newPassword);
          newPassword = newPassword.toString(CryptoJS.enc.Hex);
          const data = {
            oldPassword,
            newPassword,
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
        document.querySelector('.btn-changepassword').removeAttribute('disabled');
      });
  });
})();
