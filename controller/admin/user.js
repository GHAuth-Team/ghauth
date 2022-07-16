/* controller/user.js */

const Uuid = require('uuid')
const User = require('../../service/user')
const { GHAuthResponse } = require('../../utils/ResponseEnum')

module.exports = {
  getUserList: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret)
    if (!userData.isAdmin) {
      // 非法访问
      GHAuthResponse(ctx).forbidden('No permissions.')
      return
    }
    const currectPage = Number.parseInt(ctx.request.query.currectPage, 10) || 1
    const pageSize = Number.parseInt(ctx.request.query.pageSize, 10) || 5
    let { filter } = ctx.request.query
    if (filter) {
      filter = { playername: { $regex: new RegExp(filter.toString()) } }
    }
    const userList = await User.genUserList(filter, currectPage, pageSize).then((ret) => ret)
    GHAuthResponse(ctx).success(userList)
  },
  switchUserStatus: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret)
    if (!userData.isAdmin) {
      // 非法访问
      GHAuthResponse(ctx).forbidden('No permissions.')
      return
    }
    const { uuid } = ctx.request.query
    if (!Uuid.validate(uuid)) {
      // uuid不合法
      GHAuthResponse(ctx).forbidden('Invalid uuid.')
      return
    }
    const result = await User.switchUserStatusByUUID(uuid).then((ret) => ret)
    GHAuthResponse(ctx).success(result)
  }
}
