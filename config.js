const fs = require('fs');
const yaml = require('js-yaml');

try {
    let configFile = fs.readFileSync('./config/config.yml', 'utf8');
    let config = yaml.load(configFile);
    module.exports = config;
} catch (e) {
    throw "Configuration file not found.";
}