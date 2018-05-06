require('babel-register')({
  presets: ['es2015', 'react']
});
require('babel-polyfill');

const puppeteer = require('puppeteer');
const BarChart = require('./components/barchart');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const getVizComponent = viztype => {
  switch (viztype) {
    case 'barchart':
      return BarChart;
    default:
      throw new Error(`Viz ${viztype} not found`);
  }
};

class Renderer {
  constructor() {
    (async () => {
      this.browser = await puppeteer.launch();
    })();
  }
  render({ vizType, data, width, height }) {
    return new Promise((resolve, reject) => {
      try {
        if (!vizType) {
          console.error('No viz type provided');
          return;
        }
        if (!data) {
          console.error('No data provided');
          return;
        }

        const viz = getVizComponent(vizType);
        const el = React.createElement(viz, { data, height });
        const html = ReactDOMServer.renderToStaticMarkup(el);

        (async () => {
          const page = await this.browser.newPage();
          page.setViewport({
            width,
            height,
          });
          await page.setContent(html, {
            waitUntil: 'networkidle2',
          });
          const image = await page.screenshot({ omitBackground: false });
          resolve(image);
        })();
      } catch (e) {
        reject(e);
      }
    });
  }

  close() {
    this.browser.close();
  }
}

module.exports = Renderer;
