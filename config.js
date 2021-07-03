const fs = require('fs');
const yaml = require('js-yaml');

try {
  const configFile = fs.readFileSync('./config/config.yml', 'utf8');
  const config = yaml.load(configFile);
  module.exports = config;
} catch (e) {
  throw new Error('Configuration file not found.');
}
