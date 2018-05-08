/**
 * Set up an object to expose
 */
var FinerCommon = {
  models: require('./models/all'),
  Renderer: require('./renderer'),
};

// Expose it
module.exports = FinerCommon;