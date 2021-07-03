const { v1: uuidv1 } = require('uuid');
const crypto = require('crypto');
const { PNG } = require('pngjs-nozlib');
const config = require('./config');

function computeTextureHash(image) {
  const bufSize = 8192;
  const hash = crypto.createHash('sha256');
  const buf = Buffer.allocUnsafe(bufSize);
  const { width } = image;
  const { height } = image;
  buf.writeUInt32BE(width, 0);
  buf.writeUInt32BE(height, 4);
  let pos = 8;
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      const imgidx = (width * y + x) << 2;
      const alpha = image.data[imgidx + 3];
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
  return hash.digest('hex');
}

module.exports = {
  getRootPath: () => __dirname,
  genUUID: () => uuidv1(),
  getUserIp: (req) => req.headers['x-forwarded-for']
            || req.connection.remoteAddress
            || req.socket.remoteAddress
            || req.connection.socket.remoteAddress,
  getSkinHash: (imgdata) => computeTextureHash(PNG.sync.read(imgdata)),
  genSignedData: (data) => {
    const sign = crypto.createSign('SHA1');
    sign.update(data);
    sign.end();
    const signature = sign.sign(config.extra.signature.private);
    return signature.toString('base64');
  },
  convertUUIDwithHyphen: (uuid) => `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`,
  handleSkinImage: (imgdata) => {
    const png = PNG.sync.read(imgdata);
    if (png.width !== 64) {
      return false;
    }
    if (png.height !== 64 && png.height !== 32) {
      return false;
    }
    return PNG.sync.write(png);
  },
};
