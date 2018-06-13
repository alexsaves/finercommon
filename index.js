/**
 * Set up an object to expose
 */
var FinerCommon = {
  version: require('./package.json').version,
  models: require('./models/all')
};

// Expose it
module.exports = FinerCommon;