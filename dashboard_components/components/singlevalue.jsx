import React from 'react';
import PropTypes from 'prop-types';

const SingleValue = ({ data }) => (
  <div>
    <div style={{ width: '106px', height: '58px', color: '#4caf50', fontSize: '48px', fontWeight: 'bold', fontStyle: 'normal', fontFamily: 'BlinkMacSystemFont', fontStretch: 'normal', lineHeight: 'normal', letterSpacing: 'normal' }}>
      <span>
          98.3
      </span>
    </div>
    <div style={{ width: '106px', height: '14px' }}>
      <span style={{ fontFamily: 'BlinkMacSystemFont', fontStretch: 'normal', lineHeight: 'normal', letterSpacing: 'normal', fontSize: '10px', fontColor: '#424242' }}>
            +0.1 than Nov
      </span>
    </div>
  </div>
);

SingleValue.propTypes = {
  data: PropTypes.array.isRequired, //eslint-disable-line
};

// module.exports = SimpleBarChart;
export default SingleValue;
