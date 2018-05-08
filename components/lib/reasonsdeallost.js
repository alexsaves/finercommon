'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _price2x = require('../assets/icons/price@2x.png');

var _price2x2 = _interopRequireDefault(_price2x);

var _doesNotMeetNeeds2x = require('../assets/icons/does-not-meet-needs@2x.png');

var _doesNotMeetNeeds2x2 = _interopRequireDefault(_doesNotMeetNeeds2x);

var _analytics2x = require('../assets/icons/analytics@2x.png');

var _analytics2x2 = _interopRequireDefault(_analytics2x);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ReasonsDealLost = function ReasonsDealLost(_ref) {
  var data = _ref.data;
  return _react2.default.createElement(
    'div',
    { style: { display: 'flex' } },
    _react2.default.createElement(
      'div',
      { className: 'rl-container' },
      _react2.default.createElement(
        'span',
        { style: { height: '24px', width: '24px', backgroundColor: '#f9f9f9', borderRadius: '15px', marginLeft: '49px', display: 'inline-block', textAlign: 'center', position: 'relative', top: '10px', fontSize: '12px', paddingTop: '3px' }, className: 'rl-circle' },
        '1'
      ),
      _react2.default.createElement(
        'div',
        { style: {
            width: '116px', height: '134px', borderRadius: '2px', backgroundColor: '#f9f9f9', marginRight: '20px', textAlign: 'center'
          }
        },
        _react2.default.createElement('img', { src: _price2x2.default, style: { width: '39px', position: 'relative', top: '30%' }, alt: 'price' })
      )
    ),
    _react2.default.createElement(
      'div',
      { className: 'rl-container' },
      _react2.default.createElement(
        'span',
        { style: { height: '24px', width: '24px', backgroundColor: '#f9f9f9', borderRadius: '15px', marginLeft: '49px', display: 'inline-block', textAlign: 'center', position: 'relative', top: '10px', fontSize: '12px', paddingTop: '3px' }, className: 'rl-circle' },
        '2'
      ),
      _react2.default.createElement(
        'div',
        { style: {
            width: '116px', height: '134px', borderRadius: '2px', backgroundColor: '#f9f9f9', marginRight: '20px', textAlign: 'center'
          }
        },
        _react2.default.createElement('img', { src: _doesNotMeetNeeds2x2.default, style: { width: '48px', position: 'relative', top: '33%' }, alt: 'price' })
      )
    ),
    _react2.default.createElement(
      'div',
      { className: 'rl-container' },
      _react2.default.createElement(
        'span',
        { style: { height: '24px', width: '24px', backgroundColor: '#f9f9f9', borderRadius: '15px', marginLeft: '49px', display: 'inline-block', textAlign: 'center', position: 'relative', top: '10px', fontSize: '12px', paddingTop: '3px' }, className: 'rl-circle' },
        '3'
      ),
      _react2.default.createElement(
        'div',
        { style: {
            width: '116px', height: '134px', borderRadius: '2px', backgroundColor: '#f9f9f9', marginRight: '20px', textAlign: 'center'
          }
        },
        _react2.default.createElement('img', { src: _analytics2x2.default, style: { width: '52px', position: 'relative', top: '38%' }, alt: 'price' })
      )
    )
  );
};

ReasonsDealLost.propTypes = {
  data: _propTypes2.default.array.isRequired //eslint-disable-line
};

// module.exports = SimpleBarChart;
exports.default = ReasonsDealLost;