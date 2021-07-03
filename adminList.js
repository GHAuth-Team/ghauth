const fs = require('fs');
const yaml = require('js-yaml');

try {
  const configFile = fs.readFileSync('./config/adminList.yml', 'utf8');
  const config = yaml.load(configFile);
  module.exports = config;
} catch (e) {
  throw new Error('AdminList file not found.');
}
