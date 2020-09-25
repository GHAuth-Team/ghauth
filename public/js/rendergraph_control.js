(function () {
    var images = {}, skin = new Image(),
        texturecontainer = document.createElement('div'),
        rendercanvas = document.querySelector("#rendergraph-image"),
        remapcanvas = document.createElement('canvas'),
        resizecanvas = document.createElement('canvas');
    skin.onload = onSkinImageLoad;

    var imagelist = {
        background0001: 'background0001.jpg',
        layer_matcolor0001: 'layer_matcolor0001.png',
        layer_illum0001: 'layer_illum0001.jpg',
        layer_matcolor0002: 'layer_matcolor0002.png',
        layer_illum0002: 'layer_illum0002.jpg',
    };

    function init() {
        for (const key in imagelist) {
            var image = new Image();
            images[key] = image;
            texturecontainer.appendChild(image);
            image.src = "/images/render/" + imagelist[key];
        }
    }

    window.refreshRenderGraph = function () {
        skin.src = document.querySelector("#skinData").data.skin;
    }

    function onSkinImageLoad() {
        document.querySelector("#rendergraph-loading").classList.add("active");
        rendercanvas.classList.remove("show");
        compose();
    }

    function compose() {
        var ctx = rendercanvas.getContext('2d');
        rendercanvas.width = images.background0001.width;
        rendercanvas.height = images.background0001.height;

        // 绘制背景
        ctx.drawImage(images.background0001, 0, 0);
        // 玩家身体映射
        remap(skin, images.layer_matcolor0001, images.layer_illum0001);
        // 绘制玩家身体
        ctx.drawImage(remapcanvas, 2598, 1043);
        // 玩家头颅映射
        remap(skin, images.layer_matcolor0002, images.layer_illum0002);
        // 绘制玩家头颅
        ctx.drawImage(remapcanvas, 2875, 1023);

        setTimeout(function () {
            document.querySelector("#rendergraph-loading").classList.remove("active");
            rendercanvas.classList.add("show");
        }, 200);
    }

    function resizeSkin(image, zoom) {
        ctx = resizecanvas.getContext('2d');

        resizecanvas.width = image.width * zoom | 0;
        resizecanvas.height = resizecanvas.width;

        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width * zoom | 0, image.height * zoom | 0);
    }

    function remap(skin, map, illum) {
        // 将皮肤缩放至合适大小
        resizeSkin(skin, 256 / skin.width);
        var SkinPixelData = resizecanvas.getContext('2d').getImageData(0, 0, resizecanvas.width, resizecanvas.height).data;

        // 将皮肤映射至图层
        var remapctx = remapcanvas.getContext('2d');
        remapcanvas.width = map.width;
        remapcanvas.height = map.height;
        remapctx.drawImage(map, 0, 0);

        var mapImageData = remapctx.getImageData(0, 0, remapcanvas.width, remapcanvas.height);
        var mapPixelData = mapImageData.data;

        for (var i = 0; i < mapPixelData.length; i = i + 4) {
            if (mapPixelData[i + 3] > 0) {
                var loc = (mapPixelData[i + 1] * resizecanvas.width + mapPixelData[i]) * 4;
                mapPixelData[i] = mapPixelData[i + 3] * SkinPixelData[loc + 0] / 255;
                mapPixelData[i + 1] = mapPixelData[i + 3] * SkinPixelData[loc + 1] / 255;
                mapPixelData[i + 2] = mapPixelData[i + 3] * SkinPixelData[loc + 2] / 255;
                mapPixelData[i + 3] = mapPixelData[i + 3] * SkinPixelData[loc + 3] / 255;
            }
        }
        remapctx.putImageData(mapImageData, 0, 0);

        // 绘制光影
        remapctx.globalCompositeOperation = "multiply";
        remapctx.drawImage(illum, 0, 0);
        remapctx.globalCompositeOperation = "source-over";

        // 处理光影Alpha通道
        var finalImageData = remapctx.getImageData(0, 0, remapcanvas.width, remapcanvas.height);
        var finalPixelData = finalImageData.data;

        for (var i = 3; i < finalPixelData.length; i = i + 4) {
            finalPixelData[i] = mapPixelData[i];
        }

        remapctx.putImageData(finalImageData, 0, 0);
    }
    try {
        init()
    } catch (error) {
        toastr["error"]("皮肤预览模块发生错误");
    }
})()