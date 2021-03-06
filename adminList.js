const fs = require('fs');
const yaml = require('js-yaml');

try {
    let configFile = fs.readFileSync('./config/adminList.yml', 'utf8');
    let config = yaml.load(configFile);
    module.exports = config;
} catch (e) {
    throw "AdminList file not found.";
}