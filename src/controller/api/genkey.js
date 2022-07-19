/* controller/genkey.js */
const getRandomHex = (len = 32) => {
  const chars = 'abcdef0123456789'
  const maxPos = chars.length
  let pwd = ''
  for (let i = 0; i < len; i += 1) {
    pwd += chars.charAt(Math.floor(Math.random() * maxPos))
  }
  return pwd
}

const hexToChar = (hex) => {
  let str = ''
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  }
  return str
}

module.exports = {
  genkey: async (ctx) => {
    let secret = getRandomHex(32)
    let iv = getRandomHex(32)
    ctx.session.key = {}
    ctx.session.key.ts = Date.now()
    ctx.session.key.secret = secret
    ctx.session.key.iv = iv
    let data = ''
    for (let i = 0; i < secret.length; i += 1) {
      data += secret[i] + iv[i]
    }
    ctx.set('Content-Type', 'text/plain')
    ctx.body = hexToChar(data)
  }
}
