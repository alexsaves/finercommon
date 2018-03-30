import React from 'react';
import PropTypes from 'prop-types';

const SimpleBarChart = ({ data }) => (
  <div style={{ display: 'flex' }}>
    <div style={{ width: '116px', height: '136px', backgroundColor: '#f9f9f9', borderRadius: '2px', marginRight: '20px' }} >
      <div style={{ height: '59px', textAlign: 'center' }}>
        <span style={{ color: '#757575', fontFamily: 'BlinkMacSystemFont', fontSize: '16px', display: 'block', padding: '15px' }}>
          56%
        </span>
      </div>
      <div style={{ height: '77px', backgroundColor: '#3845ae' }} />
    </div>
    <div style={{ width: '116px', height: '136px', backgroundColor: '#f9f9f9', borderRadius: '2px', marginRight: '20px' }} >
      <div style={{ height: '87px', textAlign: 'center' }}>
        <span style={{ color: '#757575', fontFamily: 'BlinkMacSystemFont', fontSize: '16px', display: 'block', padding: '15px' }}>
          36%
        </span>
      </div>
      <div style={{ height: '50px', backgroundColor: '#ffc200' }} />
    </div>
    <div style={{ width: '116px', height: '136px', backgroundColor: '#f9f9f9', borderRadius: '2px', marginRight: '20px' }} >
      <div style={{ height: '122px', textAlign: 'center' }}>
        <span style={{ color: '#757575', fontFamily: 'BlinkMacSystemFont', fontSize: '16px', display: 'block', padding: '15px' }}>
          8%
        </span>
      </div>
      <div style={{ height: '12px', backgroundColor: '#8fa4af' }} />
    </div>
  </div>
);

SimpleBarChart.propTypes = {
  data: PropTypes.array.isRequired, //eslint-disable-line
};

// module.exports = SimpleBarChart;
export default SimpleBarChart;
