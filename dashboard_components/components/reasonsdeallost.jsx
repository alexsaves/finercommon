import React from 'react';
import PropTypes from 'prop-types';
import priceIcon from '../assets/icons/price@2x.png';
import doesNotMeetIcon from '../assets/icons/does-not-meet-needs@2x.png';
import analyticsIcon from '../assets/icons/analytics@2x.png';

const ReasonsDealLost = ({ data }) => (
  <div style={{ display: 'flex' }}>
    <div className="rl-container">
      <span style={{ height: '24px', width: '24px', backgroundColor: '#f9f9f9', borderRadius: '15px', marginLeft: '49px', display: 'inline-block', textAlign: 'center', position: 'relative', top: '10px', fontSize: '12px', paddingTop: '3px' }} className="rl-circle">1</span>
      <div style={{
        width: '116px', height: '134px', borderRadius: '2px', backgroundColor: '#f9f9f9', marginRight: '20px', textAlign: 'center',
      }}
      >
        <img src={priceIcon} style={{ width: '39px', position: 'relative', top: '30%' }} alt="price" />
      </div>
    </div>
    <div className="rl-container">
      <span style={{ height: '24px', width: '24px', backgroundColor: '#f9f9f9', borderRadius: '15px', marginLeft: '49px', display: 'inline-block', textAlign: 'center', position: 'relative', top: '10px', fontSize: '12px', paddingTop: '3px' }} className="rl-circle">2</span>
      <div style={{
        width: '116px', height: '134px', borderRadius: '2px', backgroundColor: '#f9f9f9', marginRight: '20px', textAlign: 'center',
      }}
      >
        <img src={doesNotMeetIcon} style={{ width: '48px', position: 'relative', top: '33%' }} alt="price" />
      </div>
    </div>
    <div className="rl-container">
      <span style={{ height: '24px', width: '24px', backgroundColor: '#f9f9f9', borderRadius: '15px', marginLeft: '49px', display: 'inline-block', textAlign: 'center', position: 'relative', top: '10px', fontSize: '12px', paddingTop: '3px' }} className="rl-circle">3</span>
      <div style={{
        width: '116px', height: '134px', borderRadius: '2px', backgroundColor: '#f9f9f9', marginRight: '20px', textAlign: 'center',
      }}
      >
        <img src={analyticsIcon} style={{ width: '52px', position: 'relative', top: '38%' }} alt="price" />
      </div>
    </div>
  </div>

);

ReasonsDealLost.propTypes = {
  data: PropTypes.array.isRequired, //eslint-disable-line
};

// module.exports = SimpleBarChart;
export default ReasonsDealLost;
