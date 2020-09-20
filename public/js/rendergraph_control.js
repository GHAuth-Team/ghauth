(function () {
    var images = {}, loadCount, skin = new Image(), texturecontainer = document.createElement('div'),
        rendercanvas = document.querySelector("#rendergraph-image"), remapcanvas = document.createElement('canvas');
    skin.onload = onSkinImageLoad;

    var imagelist = {
        background0001: 'background0001.jpg',
        layer_object_1_0001: 'layer_object_1_0001.png',
        layer_matcolor0001: 'layer_matcolor0001.png',
        layer_illum0001: 'layer_illum0001.jpg',
        layer_object_1_0002: 'layer_object_1_0002.png',
        layer_matcolor0002: 'layer_matcolor0002.png',
        layer_illum0002: 'layer_illum0002.jpg',
    };

    function init() {
        loadCount = 0;
        for (const key in imagelist) {
            loadCount++;
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
        merge(images.layer_object_1_0001, images.layer_matcolor0001, skin, images.layer_illum0001, function (player) {
            merge(images.layer_object_1_0002, images.layer_matcolor0002, skin, images.layer_illum0002, function (hat) {
                var canvas = rendercanvas,
                    ctx = canvas.getContext('2d');
                canvas.width = 3840;
                canvas.height = 2160;
                ctx.drawImage(images.background0001, 0, 0);
                ctx.drawImage(player, 2598, 1043);
                ctx.drawImage(hat, 2875, 1023);
                setTimeout(function () {
                    document.querySelector("#rendergraph-loading").classList.remove("active");
                    rendercanvas.classList.add("show");
                }, 500);
            });
        });
    }

    function merge(mask, uvmap, skin, illumination, onrender) {
        var c = Caman(uvmap, function () {
            this.remap(skin, uvmap.u || 'r', uvmap.v || 'g');
            this.newLayer(function () {
                this.setBlendingMode("multiply");
                this.overlayImage(illumination);
            });
            this.render(function () {
                onrender(c.canvas);
            });
        });
    }

    Caman.Filter.register("remap", function (image, uChannel, vChannel) {
        var canvas = resizeSkin(image, 256 / image.width),
            pixelData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        this.process("remap", function (rgba) {
            rgba['-r'] = 255 - rgba.r;
            rgba['-g'] = 255 - rgba.g;
            rgba['g/2'] = (0.5 * rgba['g']) | 0;
            rgba['-g/2'] = (0.5 * rgba['-g']) | 0;
            rgba['-b'] = 255 - rgba.b;
            if (rgba.a > 0) {
                var loc = (rgba[vChannel] * canvas.width + rgba[uChannel]) * 4;
                rgba.r = rgba.a * pixelData[loc + 0] / 255;
                rgba.g = rgba.a * pixelData[loc + 1] / 255;
                rgba.b = rgba.a * pixelData[loc + 2] / 255;
                rgba.a = rgba.a * pixelData[loc + 3] / 255;
            }
        });
    });

    function resizeSkin(image, zoom) {
        var canvas = remapcanvas,
            ctx = canvas.getContext('2d');

        canvas.width = image.width * zoom | 0;
        canvas.height = canvas.width;

        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width * zoom | 0, image.height * zoom | 0);
        return canvas;
    }
    try {
        init()
    } catch (error) {
        toastr["error"]("皮肤预览模块发生错误");
    }
})()