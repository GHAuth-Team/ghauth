const fs = require('fs');
const yaml = require('js-yaml');

try {
    let configFile = fs.readFileSync('./config/config.yml', 'utf8');
    let config = yaml.safeLoad(configFile);
    module.exports = config;
} catch (e) {
    throw "Configuration file not found.";
}