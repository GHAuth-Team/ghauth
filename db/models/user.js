const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
  id: {
    type: Number,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    unique: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  playername: {
    type: String,
    unique: true,
  },
  uuid: {
    type: String,
    unique: true,
  },
  password: String,
  skin: {
    type: {
      type: Number,
      default: 0, // 皮肤模型 0:默认 1:纤细
    },
    hash: {
      type: String,
      default: '9b155b4668427669ca9ed3828024531bc52fca1dcf8fbde8ccac3d9d9b53e3cf',
    },
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  tokens: [
    {
      accessToken: String,
      clientToken: String,
      status: {
        type: Number,
        default: 1, // 令牌状态 1:可用 0:失效
      },
      createAt: {
        type: Number,
        default: Date.now,
      },
    },
  ],
  ip: {
    register: String,
    lastLogged: String,
  },
  time: {
    register: Number,
    lastLogged: Number,
  },
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
