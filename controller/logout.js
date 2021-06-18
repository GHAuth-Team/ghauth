/* controller/logout.js */

module.exports = {
  logout: async (ctx) => {
    ctx.session = null;
    ctx.response.redirect('/');
  },
};
