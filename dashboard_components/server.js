
require('babel-register')({
  presets: ['es2015', 'react'],
});

const lessData = [{
  name: 'Page A', uv: 4000, pv: 2400, amt: 2400,
},
{
  name: 'Page B', uv: 3000, pv: 1398, amt: 2210,
},
{
  name: 'Page C', uv: 2000, pv: 9800, amt: 2290,
},
{
  name: 'Page D', uv: 2780, pv: 3908, amt: 2000,
}];

const express = require('express');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const fs = require('fs');
// const svg2img = require('svg2img');
const BarChart = require('./components/barchart');
// import BarChart from './components/barchart';
const btoa = require('btoa');

const app = express();
app.get('/', (request, response) => {
  const el = React.createElement(BarChart, { data: lessData });
  const html = ReactDOMServer.renderToStaticMarkup(el);
  const svg = '<svg class="recharts-surface" width="150" height="40" viewBox="0 0 150 40" version="1.1"><g class="recharts-layer recharts-bar"><g class="recharts-layer recharts-bar-rectangles"><g class="recharts-layer recharts-bar-rectangle"><path fill="#8884d8" width="28" height="30" x="8.5" y="5" radius="0" class="recharts-rectangle" d="M 8.5,5 h 28 v 30 h -28 Z"></path></g><g class="recharts-layer recharts-bar-rectangle"><path fill="#8884d8" width="28" height="22.5" x="43.5" y="12.5" radius="0" class="recharts-rectangle" d="M 43.5,12.5 h 28 v 22.5 h -28 Z"></path></g><g class="recharts-layer recharts-bar-rectangle"><path fill="#8884d8" width="28" height="15" x="78.5" y="20" radius="0" class="recharts-rectangle" d="M 78.5,20 h 28 v 15 h -28 Z"></path></g><g class="recharts-layer recharts-bar-rectangle"><path fill="#8884d8" width="28" height="20.849999999999998" x="113.5" y="14.150000000000002" radius="0" class="recharts-rectangle" d="M 113.5,14.150000000000002 h 28 v 20.849999999999998 h -28 Z"></path></g></g></g></svg>';
  // svg2img(svg, function(error, buffer) {
  //   //returns a Buffer
  //   fs.writeFileSync('foo1.png', buffer);
  // });

  response.send(html);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
