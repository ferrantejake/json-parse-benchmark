const addon = require('./build/index.node');

module.exports = {
  parseJson: addon.parseJson,
  parseJsonSerde: addon.parseJsonSerde,
  parseJsonSimd: addon.parseJsonSimd
}; 