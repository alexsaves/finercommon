import React from 'react';
import PropTypes from 'prop-types';

const COLORS = ['#3845ae', '#ffc200', '#8fa4af'];
const PADDING = 15;

const SimpleBarChart = ({ data, height }) => {
  const barCharts = data.map((d, i) => {
    return (
      <div
        style={{
          backgroundColor: '#f9f9f9',
          borderRadius: '2px',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          marginRight: i !== 2 ? '20px' : '0',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            flexGrow: 1,
          }}
        >
          <span
            style={{
              color: '#757575',
              fontFamily: 'BlinkMacSystemFont',
              fontSize: '16px',
              display: 'block',
              padding: `${PADDING}px`,
            }}
          >
            {d.percent}%
          </span>
        </div>
        <div
          style={{
            height: `${d.percent}%`,
            backgroundColor: COLORS[i % 3],
          }}
        />
      </div>
    );
  });
  return (
    <div
      style={{
        height: `${height}px`,
        display: 'flex',
      }}
    >
      {barCharts}
    </div>
  );
};

SimpleBarChart.propTypes = {
  data: PropTypes.array.isRequired, //eslint-disable-line
  height: PropTypes.number.isRequired,
};

module.exports = SimpleBarChart;
// export default SimpleBarChart;
