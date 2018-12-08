/**
 * Set up an object to expose
 */
var FinerCommon = {
  version: require('./package.json').version,
  models: require('./models/all'),
  FinerLib: require('./models/finerlib/finerlib')
};

// Expose it
module.exports = FinerCommon;