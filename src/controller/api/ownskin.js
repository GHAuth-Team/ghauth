/* controller/ownskin.js */
const path = require('path')
const fs = require('fs')
const User = require('../../service/user')
const utils = require('../../utils')

module.exports = {
  ownskin: async (ctx) => {
    const data = {}
    const userInfo = await User.getUserInfo(ctx).then((ret) => ret)
    if (userInfo.isLoggedIn) {
      const result = await User.getUserSkin(userInfo.email).then((ret) => ret)
      const skinPath = path.join(utils.getRootPath(), '../skin')
      result.skin = fs.readFileSync(path.join(skinPath, result.skin))
      result.skin = Buffer.from(result.skin).toString('base64')
      result.skin = `data:image/png;base64,${result.skin}`
      data.data = result
      data.code = 1000
    } else {
      data.code = -1
      data.msg = '你还没有登录'
    }
    ctx.set('Content-Type', 'application/json')
    ctx.body = JSON.stringify(data)
  }
}
