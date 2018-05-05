import React from 'react';
import { storiesOf } from '@storybook/react';
import BarChart from '../components/barchart';
import ReasonsDealLost from '../components/reasonsdeallost';
import SingleValue from '../components/singlevalue';
import VerticalBar from '../components/verticalBarChart';

const barChartData = [
  {
    percent: 56,
  },
  {
    percent: 36,
  },
  {
    percent: 8,
  },
];

storiesOf('Barchart', module).add('3 datapoints', () => (
  <BarChart data={barChartData} height={400} />
));

storiesOf('ReasonsDealsLost', module).add('basic', () => <ReasonsDealLost />);

storiesOf('SingleValue', module).add('basic', () => <SingleValue />);

storiesOf('VerticalBar', module).add('3 points', () => <VerticalBar />);
