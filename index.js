/**
 * Set up an object to expose
 */
var FinerCommon = {
  models: require('./models/all'),
  ChartRenderer: require('./renderer'),
  MockData: require('./mock-data.json')
};

// Expose it
module.exports = FinerCommon;