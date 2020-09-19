const config = require("./config");
const { v1: uuidv1 } = require("uuid");
const crypto = require("crypto");
const PNG = require("pngjs-nozlib").PNG;

function computeTextureHash(image) {
    const bufSize = 8192;
    let hash = crypto.createHash("sha256");
    let buf = Buffer.allocUnsafe(bufSize);
    let width = image.width;
    let height = image.height;
    buf.writeUInt32BE(width, 0);
    buf.writeUInt32BE(height, 4);
    let pos = 8;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let imgidx = (width * y + x) << 2;
            let alpha = image.data[imgidx + 3];
            buf.writeUInt8(alpha, pos + 0);
            if (alpha === 0) {
                buf.writeUInt8(0, pos + 1);
                buf.writeUInt8(0, pos + 2);
                buf.writeUInt8(0, pos + 3);
            } else {
                buf.writeUInt8(image.data[imgidx + 0], pos + 1);
                buf.writeUInt8(image.data[imgidx + 1], pos + 2);
                buf.writeUInt8(image.data[imgidx + 2], pos + 3);
            }
            pos += 4;
            if (pos === bufSize) {
                pos = 0;
                hash.update(buf);
            }
        }
    }
    if (pos > 0) {
        hash.update(buf.slice(0, pos));
    }
    return hash.digest("hex");
}

module.exports = {
    getRootPath: () => {
        return __dirname;
    },
    genUUID: () => {
        return uuidv1();
    },
    getUserIp: (req) => {
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    },
    getSkinHash: (imgdata) => {
        return computeTextureHash(PNG.sync.read(imgdata));
    },
    genSignedData: (data) => {
        const sign = crypto.createSign('SHA1');
        sign.update(data);
        sign.end();
        const signature = sign.sign(config.extra.signature.private);
        return signature.toString('base64');
    },
    convertUUIDwithHyphen: (uuid) => {
        return uuid.slice(0, 8) + "-" + uuid.slice(8, 12) + "-" + uuid.slice(12, 16) + "-" + uuid.slice(16, 20) + "-" + uuid.slice(20);
    },
    handleSkinImage: (imgdata) => {
        let png = PNG.sync.read(imgdata);
        if (png.width != 64) {
            return false;
        }
        if (png.height != 64 && png.height != 32) {
            return false;
        }
        return PNG.sync.write(png);
    }
}