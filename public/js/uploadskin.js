(() => {
  function postData(data) {
    fetch('/api/uploadskin', {
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
              message: '皮肤修改成功',
            });
            window.refreshViewer(true);
            break;
          default:
            throw new Error('未知错误');
        }
        document.querySelector('.btn-uploadskin').removeAttribute('disabled');
      })
      .catch((e) => {
        notyf.open({
          type: 'error',
          message: e,
        });
        document.querySelector('.btn-uploadskin').removeAttribute('disabled');
      });
  }

  function postSkinData(canvas) {
    const skinType = Number.parseInt(document.querySelector("input[name='skinUploadTypeRadio']:checked").value, 10);
    let skinData = '';
    if (canvas.width !== 64 || (canvas.height !== 64 && canvas.height !== 32)) {
      notyf.open({
        type: 'error',
        message: '皮肤格式错误',
      });
      return;
    }
    try {
      skinData = canvas.toDataURL('image/png');
      skinData = skinData.slice(22);
      canvas.remove();
    } catch (error) {
      canvas.remove();
      notyf.open({
        type: 'error',
        message: '皮肤上传错误',
      });
      return;
    }

    if (skinType !== 0 && skinType !== 1) {
      notyf.open({
        type: 'error',
        message: '皮肤模型选择错误',
      });
      return;
    }

    document.querySelector('.btn-uploadskin').setAttribute('disabled', 'true');
    notyf.open({
      type: 'info',
      message: '提交中，请稍后...',
    });

    fetch('/api/genkey', { method: 'POST' })
      .then((result) => result.text())
      .then((text) => {
        if (text.length === 32) {
          let oriHex = '';
          for (let i = 0; i < text.length; i++) {
            oriHex += text.charCodeAt(i).toString(16).padStart(2, '0');
          }
          let secret = '';
          let iv = '';
          for (let i = 0; i < oriHex.length; i += 1) {
            if (i % 2 === 0) {
              secret += oriHex[i];
            } else {
              iv += oriHex[i];
            }
          }

          secret = CryptoJS.enc.Hex.parse(secret);
          iv = CryptoJS.enc.Hex.parse(iv);
          const data = {
            type: skinType,
            skin: skinData,
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
        document.querySelector('.btn-uploadskin').removeAttribute('disabled');
      });
  }

  const skinHandleCanvas = document.createElement('canvas');
  const skinHandleImage = new Image();
  skinHandleImage.onload = function skinImageOnload() {
    if (this.width === 64 && (this.height === 64 || this.height === 32)) {
      skinHandleCanvas.width = this.width;
      skinHandleCanvas.height = this.height;
      skinHandleCanvas.getContext('2d').drawImage(this, 0, 0);
      window.URL.revokeObjectURL(this.src);
      document.querySelector('#skinData').data.skinType = Number.parseInt(document.querySelector("input[name='skinUploadTypeRadio']:checked").value, 10);
      document.querySelector('#skinData').data.skin = skinHandleCanvas.toDataURL('image/png');
      window.refreshViewer(false);
    } else {
      window.URL.revokeObjectURL(this.src);
      notyf.open({
        type: 'error',
        message: '皮肤尺寸必须为<b>64*64</b>或<b>64*32</b>',
      });
    }
  };

  skinHandleImage.onerror = function skinImageOnerror() {
    window.URL.revokeObjectURL(this.src);
    notyf.open({
      type: 'error',
      message: '读取皮肤时发生错误',
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    bsCustomFileInput.init();
  });

  document.querySelector('#viewSelectedSkin').addEventListener('click', () => {
    const { files } = document.querySelector('#skinFileInput');
    if (files[0]) {
      const imgsrc = window.URL.createObjectURL(files[0]);
      skinHandleImage.src = imgsrc;
    } else {
      notyf.open({
        type: 'error',
        message: '你还没有选择文件',
      });
    }
  });

  document.querySelector('.btn-uploadskin').addEventListener('click', () => {
    const skinUploadCanvas = document.createElement('canvas');
    const skinUploadImage = new Image();
    skinUploadImage.onload = function skinUploadImageOnload() {
      if (this.width === 64 && (this.height === 64 || this.height === 32)) {
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
          message: '皮肤尺寸必须为<b>64*64</b>或<b>64*32</b>',
        });
      }
    };

    skinUploadImage.onerror = function skinUploadImagOnerror() {
      window.URL.revokeObjectURL(this.src);
      notyf.open({
        type: 'error',
        message: '读取皮肤时发生错误',
      });
    };

    const { files } = document.querySelector('#skinFileInput');
    if (files[0]) {
      const imgsrc = window.URL.createObjectURL(files[0]);
      skinUploadImage.src = imgsrc;
    } else {
      notyf.open({
        type: 'error',
        message: '你还没有选择文件',
      });
    }
  });
})();
