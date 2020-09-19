/* controller/logout.js */

module.exports = {
    logout: async (ctx, next) => {
        ctx.session = null;
        ctx.response.redirect('/');
    }
}