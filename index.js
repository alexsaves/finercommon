/**
 * Set up an object to expose
 */
var FinerCommon = {
  version: require('./package.json').version,
  models: require('./models/all'),
  FinerLib: require('./models/finerlib/finerlib'),
  TestFixtureGenerator: require('./fixtures/generator')
};

// Expose it
module.exports = FinerCommon;