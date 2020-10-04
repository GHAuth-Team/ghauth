(function () {
    let images = {}, skin = new Image(),
        texturecontainer = document.createElement('div'),
        rendercanvas = document.querySelector("#rendergraph-image"),
        remapcanvas = document.createElement('canvas'),
        currectImage = 0,
        canRenderDirectly = true,
        resourcesNeedToLoad = 0,
        resourcesLoadedCounter = 0,
        renderlist = {},
        resizecanvas = document.createElement('canvas');
    skin.onload = onSkinImageLoad;

    function init() {
        fetch("./images/render/render_data.json")
            .then(result => result.json())
            .then(result => {
                renderlist = result;
            })
            .catch(e => {
                toastr["error"]("拉取渲染图数据时发生错误");
            });
    }

    window.refreshRenderGraph = function () {
        skin.src = document.querySelector("#skinData").data.skin;
    }

    function onSkinImageLoad() {
        document.querySelector("#rendergraph-loading").classList.add("active");
        document.querySelector(".rendergraph-canvas-container").classList.remove("show");
        canRenderDirectly = true;
        if (!images[renderlist[currectImage]["name"]]) {
            canRenderDirectly = false;
            resourcesNeedToLoad = Object.keys(renderlist[currectImage]["images"]).length;
            images[renderlist[currectImage]["name"]] = {};
            for (const key in renderlist[currectImage]["images"]) {
                let image = new Image();
                images[renderlist[currectImage]["name"]][key] = image;
                texturecontainer.appendChild(image);
                image.onload = onResourcesLoaded;
                image.src = "/images/render/" + renderlist[currectImage]["name"] + "/" + renderlist[currectImage]["images"][key];
            }
        }
        if (canRenderDirectly) {
            setTimeout(function () {
                compose();
            }, 200);
        }
    }

    function onResourcesLoaded() {
        resourcesLoadedCounter++;
        if (resourcesLoadedCounter == resourcesNeedToLoad) {
            resourcesLoadedCounter = 0;
            setTimeout(function () {
                compose();
            }, 100);
        }
    }

    function compose() {
        let ctx = rendercanvas.getContext('2d');
        rendercanvas.width = renderlist[currectImage]["width"];
        rendercanvas.height = renderlist[currectImage]["height"];

        // 使用滤镜
        if (renderlist[currectImage]["filter"]) {
            ctx.filter = renderlist[currectImage]["filter"];
        } else {
            ctx.filter = "";
        }

        // 绘制背景1(衔接玩家主体)(必须)
        ctx.drawImage(
            images[renderlist[currectImage]["name"]]["background0001"], // 背景层(可能不完整)
            renderlist[currectImage]["pos"]["background0001"][0], // x
            renderlist[currectImage]["pos"]["background0001"][1] // y
        );

        // 玩家一层皮肤映射(必须)
        remap(skin,
            images[renderlist[currectImage]["name"]]["layer_matcolor0001"], // 映射层
            images[renderlist[currectImage]["name"]]["layer_illum0001"] // 灯光层
        );
        // 绘制玩家一层皮肤
        ctx.drawImage(
            remapcanvas,
            renderlist[currectImage]["pos"]["first"][0], // x
            renderlist[currectImage]["pos"]["first"][1] // y
        );

        // 绘制背景2(用于抗锯齿,若提供则必须完整大小)(可选)
        if (images[renderlist[currectImage]["name"]]["background0000"]) {
            ctx.drawImage(images[renderlist[currectImage]["name"]]["background0000"], 0, 0);
        }

        // 玩家二层皮肤映射
        remap(skin,
            images[renderlist[currectImage]["name"]]["layer_matcolor0002"], // 映射层
            images[renderlist[currectImage]["name"]]["layer_illum0002"] // 灯光层
        );
        // 绘制玩家二层皮肤
        ctx.drawImage(
            remapcanvas,
            renderlist[currectImage]["pos"]["second"][0], // x
            renderlist[currectImage]["pos"]["second"][1] // y
        );

        // 设置版权信息
        document.querySelector(".rendergraph-canvas-container").dataset.copyright = renderlist[currectImage]["copyright"];

        setTimeout(function () {
            document.querySelector("#rendergraph-loading").classList.remove("active");
            document.querySelector(".rendergraph-canvas-container").classList.add("show");
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
        let SkinPixelData = resizecanvas.getContext('2d').getImageData(0, 0, resizecanvas.width, resizecanvas.height).data;

        // 将皮肤映射至图层
        let remapctx = remapcanvas.getContext('2d');
        remapcanvas.width = map.width;
        remapcanvas.height = map.height;
        remapctx.drawImage(map, 0, 0);

        let mapImageData = remapctx.getImageData(0, 0, remapcanvas.width, remapcanvas.height);
        let mapPixelData = mapImageData.data;

        for (let i = 0; i < mapPixelData.length; i = i + 4) {
            if (mapPixelData[i + 3] > 0) {
                let loc = (mapPixelData[i + 1] * resizecanvas.width + mapPixelData[i]) * 4;
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
        let finalImageData = remapctx.getImageData(0, 0, remapcanvas.width, remapcanvas.height);
        let finalPixelData = finalImageData.data;

        for (let i = 3; i < finalPixelData.length; i = i + 4) {
            finalPixelData[i] = mapPixelData[i];
        }

        remapctx.putImageData(finalImageData, 0, 0);
    }
    try {
        init()
    } catch (error) {
        toastr["error"]("皮肤渲染图模块发生错误");
    }

    let rendergraphPreviousButton = document.querySelector("#rendergraphPreviousButton");
    let rendergraphNextButton = document.querySelector("#rendergraphNextButton");

    rendergraphPreviousButton.addEventListener("click", function (e) {
        if (e.target.classList.contains("disabled")) return;
        currectImage--;
        checkCurrectImage();
    })

    rendergraphNextButton.addEventListener("click", function (e) {
        if (e.target.classList.contains("disabled")) return;
        currectImage++;
        checkCurrectImage();
    })

    function checkCurrectImage() {
        if (currectImage > 0) {
            rendergraphPreviousButton.classList.remove("disabled");
        } else {
            rendergraphPreviousButton.classList.add("disabled");
        }

        if (currectImage < renderlist.length - 1) {
            rendergraphNextButton.classList.remove("disabled");
        } else {
            rendergraphNextButton.classList.add("disabled");
        }

        window.refreshRenderGraph();
    }

})()