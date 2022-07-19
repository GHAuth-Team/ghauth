(() => {
  const skinViewer = {
    el: document.querySelector('.skinviewer-container'),
    handle: null,
    action: {
      walk: null,
      run: null,
    },
    rotate: null,
  };

  function resizeSkinViewer() {
    skinViewer.handle.width = skinViewer.el.offsetWidth;
    skinViewer.handle.height = skinViewer.el.offsetHeight;
  }

  fetch('/api/ownskin', { method: 'GET' })
    .then((result) => result.json())
    .then((json) => {
      if (json.code === '-1') {
        notyf.open({
          type: 'error',
          message: '皮肤信息获取失败',
        });
      } else {
        try {
          document.querySelector('#skinData').data = json.data;
          skinViewer.handle = new skinview3d.FXAASkinViewer({
            canvas: document.querySelector('.skinviewer-canvas'),
            alpha: false,
            width: skinViewer.el.offsetWidth,
            height: skinViewer.el.offsetWHeight,
          });
          skinViewer.handle.background = 0xdddfe2;
          skinViewer.handle.loadSkin(json.data.skin, json.data.skinType ? 'slim' : 'default');
          resizeSkinViewer();
          const control = skinview3d.createOrbitControls(skinViewer.handle);
          control.enableRotate = true;
          control.enableZoom = false;
          control.enablePan = false;
          skinViewer.action.walk = skinViewer.handle.animations.add(skinview3d.WalkingAnimation);
          skinViewer.action.walk.speed = 0.6;
          skinViewer.rotate = skinViewer.handle.animations.add(skinview3d.RotatingAnimation);
          setTimeout(() => {
            document.querySelector('#skinviewer-loading').classList.remove('active');
          }, 200);
        } catch (error) {
          notyf.open({
            type: 'error',
            message: '皮肤模块加载错误',
          });
        }
      }
    })
    .catch(() => {
      notyf.open({
        type: 'error',
        message: '皮肤模块加载错误',
      });
    });

  // 监听窗口大小变化，以修改skinviewer大小
  window.addEventListener('resize', () => {
    if (skinViewer.handle.width !== skinViewer.el.offsetWidth || skinViewer.handle.height !== skinViewer.el.offsetHeight) {
      resizeSkinViewer();
    }
  }, false);

  // 刷新皮肤
  window.refreshSkinviewer = function refreshSkinviewer() {
    document.querySelector('#skinviewer-loading').classList.add('active');
    skinViewer.handle.loadSkin(document.querySelector('#skinData').data.skin, document.querySelector('#skinData').data.skinType ? 'slim' : 'default');
    setTimeout(() => {
      document.querySelector('#skinviewer-loading').classList.remove('active');
    }, 200);
  };

  // 临时暂停，传入false后恢复原始状态
  window.pauseSkinviewer = function pauseSkinviewer(state) {
    skinViewer.handle.animations.paused = state || document.querySelector('#skinviewerPauseCheckbox').checked;
  };

  document.querySelector('#skinviewerWalkRadio').onchange = function skinviewerWalkRadioOnchange(e) {
    if (e.target.value === 'on') {
      skinViewer.action.walk = skinViewer.handle.animations.add(skinview3d.WalkingAnimation);
      skinViewer.action.walk.speed = 0.6;
      if (skinViewer.action.run) {
        skinViewer.action.run.remove();
        skinViewer.action.run = null;
      }
    }
  };

  document.querySelector('#skinviewerRunRadio').onchange = function skinviewerRunRadioOnchange(e) {
    if (e.target.value === 'on') {
      skinViewer.action.run = skinViewer.handle.animations.add(skinview3d.RunningAnimation);
      skinViewer.action.run.speed = 0.6;
      if (skinViewer.action.walk) {
        skinViewer.action.walk.remove();
        skinViewer.action.walk = null;
      }
    }
  };
  document.querySelector('#skinviewerRotateCheckbox').onchange = function skinviewerRotateCheckboxOnchange(e) {
    if (e.target.checked) {
      skinViewer.rotate.paused = false;
    } else {
      skinViewer.rotate.paused = true;
    }
  };
  document.querySelector('#skinviewerPauseCheckbox').onchange = function skinviewerPauseCheckboxOnchange(e) {
    if (e.target.checked) {
      skinViewer.handle.animations.paused = true;
    } else {
      skinViewer.handle.animations.paused = false;
    }
  };
})();
