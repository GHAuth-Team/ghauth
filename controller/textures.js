/* controller/textures.js */
const utils = require("../utils");
const fs = require("fs");
const path = require("path");

module.exports = {
    textures: async (ctx, next) => {
        const hash = ctx.params.hash;
        if (hash.length == 64) {
            let skinPath = path.join(utils.getRootPath(), "./skin");
            try {
                let skin = fs.readFileSync(path.join(skinPath, hash + ".png"));
                ctx.set("Content-Type", "image/png");
                ctx.body = skin;
            } catch (error) {
                
            }
        }
    }
}