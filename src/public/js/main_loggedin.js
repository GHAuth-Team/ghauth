(() => {
  function checkBrowser() {
      try {
          // canvas toBlob检测
          var tempCanvas = document.createElement("canvas");
          tempCanvas.toBlob(function () {
              tempCanvas.remove();
          });
      } catch (error) {
          document.querySelector("#browser-warning").style.display = "block";
          console.log(error)
      }
  }
  checkBrowser();

  /* eslint-disable */
  // yggdrasil配置按钮 拖拽
  document.querySelector('.btn-dnd-button').addEventListener('dragstart', (e) => {
    const btn = e.target;
    const content = `authlib-injector:yggdrasil-server:${encodeURIComponent(btn.dataset.clipboardText)}`;
    e.dataTransfer && (e.dataTransfer.setData('text/plain', content), e.dataTransfer.dropEffect = 'copy');
  });

  // yggdrasil配置按钮 点击
  document.querySelector('.btn-dnd-button').addEventListener('click', (e) => {
    const btn = e.target;
    const content = btn.dataset.clipboardText;
    const tInput = document.createElement('input');
    tInput.style.visibility = 'none', tInput.value = content, document.body.appendChild(tInput), tInput.select(), document.execCommand('copy'), tInput.remove();
    const rawText = btn.textContent;
    btn.disabled = !0, btn.innerHTML = '已复制', setTimeout(() => {
      btn.textContent = rawText, btn.disabled = !1;
    }, 1e3);
  });
  /* eslint-enable */

  // 切换皮肤浏览至 模型
  document.querySelector('#viewer3DModelRadio').onchange = (e) => {
    if (e.target.value === 'on') {
      window.pauseSkinviewer(false);
      document.querySelector('#skinData').dataset.type = '0';
      window.refreshSkinviewer();
      document.querySelector('.viewer-container.active').classList.remove('active');
      document.querySelector('.skinviewer-main-container').classList.add('active');
    }
  };

  // 切换皮肤浏览至 原始图片
  document.querySelector('#viewerRawImage').onchange = (e) => {
    if (e.target.value === 'on') {
      window.pauseSkinviewer(true);
      document.querySelector('#skinData').dataset.type = '1';
      window.refreshRawImage();
      document.querySelector('.viewer-container.active').classList.remove('active');
      document.querySelector('.rawimage-main-container').classList.add('active');
    }
  };

  // 切换皮肤浏览至 渲染图
  document.querySelector('#viewerRenderGraph').onchange = (e) => {
    if (e.target.value === 'on') {
      window.pauseSkinviewer(true);
      document.querySelector('#skinData').dataset.type = '2';
      window.refreshRenderGraph();
      document.querySelector('.viewer-container.active').classList.remove('active');
      document.querySelector('.rendergraph-main-container').classList.add('active');
    }
  };
  window.refreshViewer = (remote) => {
    if (remote) {
      fetch('/api/ownskin', { method: 'GET' })
        .then((result) => result.json())
        .then((json) => {
          if (json.code === '-1') {
            notyf.open({
              type: 'error',
              message: '皮肤信息获取失败',
            });
          } else {
            document.querySelector('#skinData').data = json.data;
            const { type } = document.querySelector('#skinData').dataset;
            if (type === '0') {
              window.refreshSkinviewer();
            } else if (type === '1') {
              window.refreshRawImage();
            } else {
              window.refreshRenderGraph();
            }
          }
        })
        .catch(() => {
          notyf.open({
            type: 'error',
            message: '皮肤信息获取失败',
          });
        });
    } else {
      const { type } = document.querySelector('#skinData').dataset;
      if (type === '0') {
        window.refreshSkinviewer();
      } else if (type === '1') {
        window.refreshRawImage();
      } else {
        window.refreshRenderGraph();
      }
    }
  };
  document.querySelector('#skin-refresh').addEventListener('click', () => {
    window.refreshViewer(true);
  });
})();
