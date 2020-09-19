/* controller/index.js */

const config = require("../config");
const user = require("../service/user");

options = {
    year: 'numeric', month: 'numeric', day: 'numeric'
};
const dateFormatter = new Intl.DateTimeFormat('zh-CN', options);

module.exports = {
    index: async (ctx, next) => {
        let userData = await user.getUserInfo(ctx).then(result => { return result; });
        await ctx.render('index', {
            config: config.common,
            user: userData,
            dateFormatter: dateFormatter
        })
    }
}