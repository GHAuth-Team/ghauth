/* controller/textures.js */
const fs = require('fs')
const path = require('path')
const utils = require('../utils')
const { YggdrasilResponse } = require('../utils/ResponseEnum')

module.exports = {
  textures: async (ctx) => {
    const { hash } = ctx.params
    if (hash.length === 64) {
      const skinPath = path.join(utils.getRootPath(), './skin')
      try {
        const skin = fs.readFileSync(path.join(skinPath, `${hash.replace(/\\|\/|\./g, '')}.png`))
        ctx.set('Content-Type', 'image/png')
        ctx.body = skin
      } catch (e) {
        YggdrasilResponse(ctx).noContent()
      }
    }
  }
}
