'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SingleValue = function SingleValue(_ref) {
  var data = _ref.data;
  return _react2.default.createElement(
    'div',
    null,
    _react2.default.createElement(
      'div',
      { style: { width: '106px', height: '58px', color: '#4caf50', fontSize: '48px', fontWeight: 'bold', fontStyle: 'normal', fontFamily: 'BlinkMacSystemFont', fontStretch: 'normal', lineHeight: 'normal', letterSpacing: 'normal' } },
      _react2.default.createElement(
        'span',
        null,
        '98.3'
      )
    ),
    _react2.default.createElement(
      'div',
      { style: { width: '106px', height: '14px' } },
      _react2.default.createElement(
        'span',
        { style: { fontFamily: 'BlinkMacSystemFont', fontStretch: 'normal', lineHeight: 'normal', letterSpacing: 'normal', fontSize: '10px', fontColor: '#424242' } },
        '+0.1 than Nov'
      )
    )
  );
};

SingleValue.propTypes = {
  data: _propTypes2.default.array.isRequired //eslint-disable-line
};

// module.exports = SimpleBarChart;
exports.default = SingleValue;