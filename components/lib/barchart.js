'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var COLORS = ['#3845ae', '#ffc200', '#8fa4af'];
var PADDING = 15;

var SimpleBarChart = function SimpleBarChart(_ref) {
  var data = _ref.data,
      height = _ref.height;

  var barCharts = data.map(function (d, i) {
    return _react2.default.createElement(
      'div',
      {
        style: {
          backgroundColor: '#f9f9f9',
          borderRadius: '2px',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          marginRight: i !== 2 ? '20px' : '0'
        }
      },
      _react2.default.createElement(
        'div',
        {
          style: {
            textAlign: 'center',
            flexGrow: 1
          }
        },
        _react2.default.createElement(
          'span',
          {
            style: {
              color: '#757575',
              fontFamily: 'BlinkMacSystemFont',
              fontSize: '16px',
              display: 'block',
              padding: PADDING + 'px'
            }
          },
          d.percent,
          '%'
        )
      ),
      _react2.default.createElement('div', {
        style: {
          height: d.percent + '%',
          backgroundColor: COLORS[i % 3]
        }
      })
    );
  });
  return _react2.default.createElement(
    'div',
    {
      style: {
        height: height + 'px',
        display: 'flex'
      }
    },
    barCharts
  );
};

SimpleBarChart.propTypes = {
  data: _propTypes2.default.array.isRequired, //eslint-disable-line
  height: _propTypes2.default.number.isRequired
};

module.exports = SimpleBarChart;
// export default SimpleBarChart;