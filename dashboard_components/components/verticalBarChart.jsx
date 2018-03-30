import React from 'react';
import PropTypes from 'prop-types';
import VertBarImg from '../assets/images/verticalbarchart.png';

const VerticalBarChart = ({ data }) => (
  <div>
    <img src={VertBarImg} alt="Vert" />
  </div>
);

VerticalBarChart.propTypes = {
  data: PropTypes.array.isRequired, //eslint-disable-line
};

// module.exports = SimpleBarChart;
export default VerticalBarChart;
