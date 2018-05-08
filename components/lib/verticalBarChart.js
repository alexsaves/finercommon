'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VerticalBarChart = function VerticalBarChart(_ref) {
  var data = _ref.data;
  return _react2.default.createElement('div', null);
};

VerticalBarChart.propTypes = {
  data: _propTypes2.default.array.isRequired //eslint-disable-line
};

// module.exports = SimpleBarChart;
exports.default = VerticalBarChart;