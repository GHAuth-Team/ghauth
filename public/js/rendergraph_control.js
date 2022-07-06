(() => {
  const images = {};
  const skinImage = new Image();
  const texturecontainer = document.createElement('div');
  const rendercanvas = document.querySelector('#rendergraph-image');
  const remapcanvas = document.createElement('canvas');
  const blurcanvas = document.createElement('canvas');
  const blurctx = blurcanvas.getContext('2d');
  let currectImage = 0;
  let canRenderDirectly = true;
  let resourcesNeedToLoad = 0;
  let resourcesLoadedCounter = 0;
  let renderlist = {};
  const resizecanvas = document.createElement('canvas');
  function resizeSkin(image, zoom) {
    const ctx = resizecanvas.getContext('2d');

    resizecanvas.width = image.width * zoom | 0;
    resizecanvas.height = resizecanvas.width;

    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width * zoom | 0, image.height * zoom | 0);
  }

  function blurCanvas(canvas) {
    // 将传入的 canvas 复制到 blurcanvas 上，并将其模糊
    blurcanvas.height = canvas.height;
    blurcanvas.width = canvas.width;
    blurctx.clearRect(0, 0, blurcanvas.width, blurcanvas.height);
    blurctx.filter = 'blur(1px)';
    blurctx.drawImage(canvas, 0, 0);
  }

  function remap(skin, map, illum) {
    // 将皮肤缩放至合适大小
    resizeSkin(skin, 256 / skin.width);
    const SkinPixelData = resizecanvas.getContext('2d').getImageData(0, 0, resizecanvas.width, resizecanvas.height).data;

    // 将皮肤映射至图层
    const remapctx = remapcanvas.getContext('2d');
    remapcanvas.width = map.width;
    remapcanvas.height = map.height;
    remapctx.drawImage(map, 0, 0);

    const mapImageData = remapctx.getImageData(0, 0, remapcanvas.width, remapcanvas.height);
    const mapPixelData = mapImageData.data;

    for (let i = 0; i < mapPixelData.length; i += 4) {
      if (mapPixelData[i + 3] > 0) {
        const loc = (mapPixelData[i + 1] * resizecanvas.width + mapPixelData[i]) * 4;
        mapPixelData[i] = (mapPixelData[i + 3] * SkinPixelData[loc + 0]) / 255;
        mapPixelData[i + 1] = (mapPixelData[i + 3] * SkinPixelData[loc + 1]) / 255;
        mapPixelData[i + 2] = (mapPixelData[i + 3] * SkinPixelData[loc + 2]) / 255;
        mapPixelData[i + 3] = (mapPixelData[i + 3] * SkinPixelData[loc + 3]) / 255;
      }
    }
    remapctx.putImageData(mapImageData, 0, 0);

    // 绘制光影
    remapctx.globalCompositeOperation = 'multiply';
    remapctx.drawImage(illum, 0, 0);
    remapctx.globalCompositeOperation = 'source-over';

    // 处理光影Alpha通道
    const finalImageData = remapctx.getImageData(0, 0, remapcanvas.width, remapcanvas.height);
    const finalPixelData = finalImageData.data;

    for (let i = 3; i < finalPixelData.length; i += 4) {
      finalPixelData[i] = mapPixelData[i];
    }

    remapctx.putImageData(finalImageData, 0, 0);
  }

  function compose() {
    const ctx = rendercanvas.getContext('2d');
    rendercanvas.width = renderlist[currectImage].width;
    rendercanvas.height = renderlist[currectImage].height;

    // 使用滤镜
    if (renderlist[currectImage].filter) {
      ctx.filter = renderlist[currectImage].filter;
    } else {
      ctx.filter = '';
    }

    // 绘制背景1(临时绘制，定位用)
    ctx.drawImage(
      images[renderlist[currectImage].name].background0001, // 背景层(可能不完整)
      renderlist[currectImage].pos.background0001[0], // x
      renderlist[currectImage].pos.background0001[1], // y
    );

    // 模糊背景1
    blurCanvas(resizecanvas);

    // 绘制模糊的背景1
    ctx.drawImage(
      blurcanvas,
      renderlist[currectImage].pos.background0001[0], // x
      renderlist[currectImage].pos.background0001[1], // y
    );

    // 绘制背景1(衔接玩家主体)(必须)
    ctx.drawImage(
      images[renderlist[currectImage].name].background0001, // 背景层(可能不完整)
      renderlist[currectImage].pos.background0001[0], // x
      renderlist[currectImage].pos.background0001[1], // y
    );

    // 玩家一层皮肤映射(必须)
    remap(
      skinImage,
      images[renderlist[currectImage].name].layer_matcolor0001, // 映射层
      images[renderlist[currectImage].name].layer_illum0001, // 灯光层
    );

    // 模糊第一层皮肤
    blurCanvas(remapcanvas);

    // 绘制模糊的第一层皮肤
    ctx.drawImage(
      blurcanvas,
      renderlist[currectImage].pos.first[0], // x
      renderlist[currectImage].pos.first[1], // y
    ); 

    // 绘制玩家一层皮肤，透明度为0.5
    ctx.globalAlpha = 0.5;
    ctx.drawImage(
      remapcanvas,
      renderlist[currectImage].pos.first[0], // x
      renderlist[currectImage].pos.first[1], // y
    );
    ctx.globalAlpha = 1;

    // 绘制背景2(用于抗锯齿,若提供则必须完整大小)(可选)
    if (images[renderlist[currectImage].name].background0000) {
      ctx.drawImage(images[renderlist[currectImage].name].background0000, 0, 0);
    }

    // 玩家二层皮肤映射
    remap(
      skinImage,
      images[renderlist[currectImage].name].layer_matcolor0002, // 映射层
      images[renderlist[currectImage].name].layer_illum0002, // 灯光层
    );

    // 模糊第二层皮肤
    blurCanvas(remapcanvas);

    // 绘制模糊的第二层皮肤
    ctx.drawImage(
      blurcanvas,
      renderlist[currectImage].pos.second[0], // x
      renderlist[currectImage].pos.second[1], // y
    );

    // 绘制玩家二层皮肤，透明度为0.5
    ctx.globalAlpha = 0.5;
    ctx.drawImage(
      remapcanvas,
      renderlist[currectImage].pos.second[0], // x
      renderlist[currectImage].pos.second[1], // y
    );
    ctx.globalAlpha = 1;

    // 设置版权信息
    document.querySelector('.rendergraph-canvas-container').dataset.copyright = renderlist[currectImage].copyright;

    setTimeout(() => {
      document.querySelector('#rendergraph-loading').classList.remove('active');
      document.querySelector('.rendergraph-canvas-container').classList.add('show');
    }, 200);
  }

  function onResourcesLoaded() {
    resourcesLoadedCounter += 1;
    if (resourcesLoadedCounter === resourcesNeedToLoad) {
      resourcesLoadedCounter = 0;
      setTimeout(() => {
        compose();
      }, 100);
    }
  }

  function onSkinImageLoad() {
    document.querySelector('#rendergraph-loading').classList.add('active');
    document.querySelector('.rendergraph-canvas-container').classList.remove('show');
    canRenderDirectly = true;
    if (!images[renderlist[currectImage].name]) {
      canRenderDirectly = false;
      resourcesNeedToLoad = Object.keys(renderlist[currectImage].images).length;
      images[renderlist[currectImage].name] = {};
      for (const key of Object.keys(renderlist[currectImage].images)) {
        const image = new Image();
        images[renderlist[currectImage].name][key] = image;
        texturecontainer.appendChild(image);
        image.onload = onResourcesLoaded;
        image.src = `/images/render/${renderlist[currectImage].name}/${renderlist[currectImage].images[key]}`;
      }
    }
    if (canRenderDirectly) {
      setTimeout(() => {
        compose();
      }, 200);
    }
  }

  skinImage.onload = onSkinImageLoad;

  function init() {
    fetch('./images/render/render_data.json')
      .then((result) => result.json())
      .then((result) => {
        renderlist = result;
      })
      .catch(() => {
        notyf.open({
          type: 'error',
          message: '拉取渲染图数据时发生错误',
        });
      });
  }

  window.refreshRenderGraph = () => {
    skinImage.src = document.querySelector('#skinData').data.skin;
  };

  try {
    init();
  } catch (error) {
    notyf.open({
      type: 'error',
      message: '皮肤渲染图模块发生错误',
    });
  }

  const rendergraphPreviousButton = document.querySelector('#rendergraphPreviousButton');
  const rendergraphNextButton = document.querySelector('#rendergraphNextButton');

  function checkCurrectImage() {
    if (currectImage > 0) {
      rendergraphPreviousButton.classList.remove('disabled');
    } else {
      rendergraphPreviousButton.classList.add('disabled');
    }

    if (currectImage < renderlist.length - 1) {
      rendergraphNextButton.classList.remove('disabled');
    } else {
      rendergraphNextButton.classList.add('disabled');
    }

    window.refreshRenderGraph();
  }

  rendergraphPreviousButton.addEventListener('click', (e) => {
    if (e.target.classList.contains('disabled')) return;
    currectImage -= 1;
    checkCurrectImage();
  });

  rendergraphNextButton.addEventListener('click', (e) => {
    if (e.target.classList.contains('disabled')) return;
    currectImage += 1;
    checkCurrectImage();
  });
})();
