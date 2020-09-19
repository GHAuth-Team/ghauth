const mongoose = require('mongoose');
const config = require('../config');


mongoose.set('useCreateIndex', true);
mongoose.connect(`mongodb://${config.extra.mongodb.hasAuth ? `${config.extra.mongodb.username}:${config.extra.mongodb.password}@` : ""}${config.extra.mongodb.host}/${config.extra.mongodb.db}`, { useNewUrlParser: true, useUnifiedTopology: true });

