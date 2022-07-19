/* controller/index.js */

const config = require('../config')
const User = require('../service/user')

const options = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
}
const dateFormatter = new Intl.DateTimeFormat('zh-CN', options)

module.exports = {
  index: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret)
    await ctx.render('index', {
      config: config.common,
      user: userData,
      dateFormatter
    })
  }
}
