require('babel-register')({
  presets: ['es2015', 'react'],
});

const Renderer = require('./renderer');
const mockData = require('./mock-data.json');

const lostDeals = mockData.losingDealsTo;
const totalLostDealsAmount = lostDeals.reduce(
  (acc, deal) => acc + deal.Amount,
  0 //eslint-disable-line
);

const barChartData = mockData.losingDealsTo.map(lostDeal => {
  const res = {};
  res.percent = Math.round(lostDeal.Amount / totalLostDealsAmount * 100); //eslint-disable-line
  return res;
});

const express = require('express');

const app = express();
const renderer = new Renderer();

app.get('/', (request, response) => {
  (async () => {
    console.time('render');
    const image = await renderer.render({
      vizType: 'barchart',
      data: barChartData.slice(0, 3),
      width: 400,
      height: 150,
    });
    console.timeEnd('render');
    response.contentType('image/jpeg');
    response.end(image);
  })();
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
