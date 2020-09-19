(function () {
    var skinViewer = {
        el: document.querySelector(".skinviewer-container"),
        handle: null,
        action: {
            walk: null,
            run: null,
        },
        rotate: null
    };

    $.get("/api/ownskin")
        .success(function (json) {
            if (json.code == "-1") {
                toastr["error"]("皮肤信息获取失败");
            } else {
                try {
                    document.querySelector("#skinData").data = json.data;
                    skinViewer.handle = new skinview3d.FXAASkinViewer({
                        canvas: document.querySelector(".skinviewer-canvas"),
                        alpha: false,
                        width: skinViewer.el.offsetWidth,
                        height: skinViewer.el.offsetWHeight
                    });
                    skinViewer.handle.renderer.setClearColor(0xdddfe2);
                    skinViewer.handle.loadSkin(json.data.skin, json.data.skinType ? "slim" : "default")
                    resizeSkinViewer()
                    var control = skinview3d.createOrbitControls(skinViewer.handle);
                    control.enableRotate = true;
                    control.enableZoom = false;
                    control.enablePan = false;
                    skinViewer.action.walk = skinViewer.handle.animations.add(skinview3d.WalkingAnimation);
                    skinViewer.action.walk.speed = 0.6;
                    skinViewer.rotate = skinViewer.handle.animations.add(skinview3d.RotatingAnimation);
                    setTimeout(function () {
                        document.querySelector("#skinviewer-loading").classList.remove("active");
                    }, 500);
                } catch (error) {
                    console.log(error)
                    toastr["error"]("皮肤模块加载错误");
                }
            }
        })

    // 监听窗口大小变化，以修改skinviewer大小
    window.addEventListener('resize', function () {
        if (skinViewer.handle.width != skinViewer.el.offsetWidth || skinViewer.handle.height != skinViewer.el.offsetHeight) {
            resizeSkinViewer()
        }
    }, false);

    function resizeSkinViewer() {
        skinViewer.handle.width = skinViewer.el.offsetWidth;
        skinViewer.handle.height = skinViewer.el.offsetHeight;
    }

    window.refreshSkinviewer = function () {
        document.querySelector("#skinviewer-loading").classList.add("active");
        skinViewer.handle.loadSkin(document.querySelector("#skinData").data.skin, document.querySelector("#skinData").data.skinType ? "slim" : "default");
        setTimeout(function () {
            document.querySelector("#skinviewer-loading").classList.remove("active");
        }, 500);
    }


    document.querySelector("#skinviewerWalkRadio").onchange = function (e) {
        if (e.target.value == "on") {
            skinViewer.action.walk = skinViewer.handle.animations.add(skinview3d.WalkingAnimation);
            skinViewer.action.walk.speed = 0.6;
            if (skinViewer.action.run) {
                skinViewer.action.run.remove();
                skinViewer.action.run = null;
            }
        }
    }

    document.querySelector("#skinviewerRunRadio").onchange = function (e) {
        if (e.target.value = "on") {
            skinViewer.action.run = skinViewer.handle.animations.add(skinview3d.RunningAnimation);
            skinViewer.action.run.speed = 0.6;
            if (skinViewer.action.walk) {
                skinViewer.action.walk.remove();
                skinViewer.action.walk = null;
            }
        }
    }
    document.querySelector("#skinviewerRotateCheckbox").onchange = function (e) {
        if (e.target.checked) {
            skinViewer.rotate.paused = false;
        } else {
            skinViewer.rotate.paused = true;
        }
    }
    document.querySelector("#skinviewerPauseCheckbox").onchange = function (e) {
        if (e.target.checked) {
            skinViewer.handle.animations.paused = true;
        } else {
            skinViewer.handle.animations.paused = false;
        }
    }


})()