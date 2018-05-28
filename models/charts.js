const streamToBuffer = require('stream-to-buffer');

const fontFace = "Arial";
const lightColor = "#f3f3f3";
const darkerColorLight = "#424242";
const darkerColor = "#757575";

/**
 * Charting class
 */
class Charts {
  /**
   * Sets up a new charter
   */
  constructor() {}

  /**
   * Draw a rounded rectangkle
   * @param {Canvas} ctx 
   * @param {String} color 
   * @param {Number} x 
   * @param {Number} y 
   * @param {Number} w 
   * @param {Number} h 
   * @param {Number} cornerRadius 
   */
  _roundedRectangle(ctx, color, x, y, w, h, cornerRadius) {
    ctx.lineJoin = "round";
    ctx.lineWidth = cornerRadius;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.strokeRect(x + (cornerRadius / 2), y + (cornerRadius / 2), w - cornerRadius, h - cornerRadius);
    ctx.fillRect(x + (cornerRadius / 2), y + (cornerRadius / 2), w - cornerRadius, h - cornerRadius);
  }

  /**
   * Center some text
   * @param {Canvas} ctx 
   * @param {String} font 
   * @param {String} text 
   * @param {String} color 
   * @param {Number} x 
   * @param {Number} y 
   * @param {Number} w 
   */
  _centerText(ctx, font, text, color, x, y, w) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, Math.round((w / 2) + x), y, w);
  }

  /**
   * Convert a canvas to an bufffer
   * @param {*} ctx 
   */
  _canvasToPNGBufferAsync(ctx) {
    let strm = ctx.pngStream();
    return new Promise((resolve, reject) => {
      streamToBuffer(strm, function (err, buffer) {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }


  /**
   * Draw an individual score strip
   * @param {Canvas} ctx 
   * @param {Number} x 
   * @param {Number} y 
   * @param {Number} w 
   * @param {Number} generalScale 
   * @param {Number} fontSize 
   * @param {Number} barHeight 
   * @param {Number} fontHeight 
   * @param {Object} rowData 
   * @param {Number} maxScore 
   * @param {Number} barColor 
   */
  _drawScoreStrip(ctx, x, y, w, generalScale, fontSize, barHeight, fontHeight, rowData, maxScore, barColor) {
    ctx.font = fontSize + "px " + fontFace;
    ctx.fillStyle = darkerColorLight;
    ctx.strokeStyle = darkerColorLight;
    ctx.textAlign = "left";
    ctx.fillText(rowData.label, x, y + fontHeight - (fontHeight * 0.3), (w / 2));
    const barZoneWidth = w / 2;
    const padding = barZoneWidth / 40;
    const barWidth = (barZoneWidth - ((maxScore - 1) * padding)) / maxScore;
    let leftPosition = w - barZoneWidth;
    const barYOffset = (fontHeight - barHeight) / 2.5;
    for (let i = 0; i < maxScore; i++) {
      ctx.fillStyle = lightColor;
      if (i+1 <= rowData.score) {
        ctx.fillStyle = barColor;
      }
      ctx.fillRect(leftPosition + x, y + barYOffset, barWidth, barHeight);
      leftPosition += barWidth + padding;
    }
  }

  /**
   * Draw a score strip\
   * Sample data:
   * [
      [{
          label: "Price",
          score: 3
        },
        {
          label: "Reports",
          score: 2
        },
        {
          label: "Service",
          score: 4
        }
      ],
      [{
          label: "Product",
          score: 5
        },
        {
          label: "Timeliness",
          score: 1
        },
        {
          label: "Integration",
          score: 0
        }
      ],
      [{
          label: "Service",
          score: 3
        },
        {
          label: "Product",
          score: 5
        },
        {
          label: "Timeliness",
          score: 2
        }
      ]
    ]
   * @param {Number} w 
   * @param {Number} maxScore 
   * @param {Array} data 
   * @param {Number} paddingOverride 
   * @param {Number} fontSizeOverride 
   */
  async scoreStripsAsync(w, maxScore, data, paddingOverride, fontSizeOverride) {
    const cols = data.length;
    const generalScale = w / 500;
    const padding = paddingOverride || (generalScale * 24);
    const fontSize = Math.round(fontSizeOverride || (generalScale * 11));
    const fontHeight = Math.round(fontSize * 1.3);
    const colSize = ((w - ((cols - 1) * padding)) / cols);
    const barHeight = fontHeight * 0.3;
    const barColors = ["#3845ae", "#ffc200", "#8fa4af"];
    const maxRows = data.reduce((previousValue, col) => {
      return Math.max(previousValue, col.length);
    }, 0);
    const h = maxRows * fontHeight;
    let leftPosition = 0;

    if (arguments.length < 3) {
      throw new Error("Missing arguments");
    }

    const Canvas = require('canvas');
    var Image = Canvas.Image,
      canvas = new Canvas(w, h),
      ctx = canvas.getContext('2d');

    for (let c = 0; c < cols; c++) {
      let topPosition = 0;
      for (let r = 0; r < data[c].length; r++) {
        let row = data[c][r];
        this._drawScoreStrip(ctx, leftPosition, topPosition, colSize, generalScale, fontSize, barHeight, fontHeight, row, maxScore, barColors[c]);
        topPosition += fontHeight;
      }
      leftPosition += colSize + padding;
    }
    return await this._canvasToPNGBufferAsync(canvas);
  }

  /**
   * Draw a bar chart widget.
   * Example data object:
   * [{
      title: "Salesforce",
      subTitle: "won $2.5M",
      dataLabel: "56%",
      quantityFilled: 0.56
    },
    {
      title: "Oracle",
      subTitle: "won $1.8M",
      dataLabel: "30%",
      quantityFilled: 0.30
    },
    {
      title: "Microsoft",
      subTitle: "won $0.7M",
      dataLabel: "8%",
      quantityFilled: 0.08
    }
  ]
   * @param {Number} w 
   * @param {Number} h 
   * @param {Array} data 
   * @param {Number} paddingOverride 
   * @param {Number} fontSizeOverride 
   * @param {Number} borderRadiusOverride 
   */
  async barChartAsync(w, h, data, paddingOverride, fontSizeOverride, borderRadiusOverride) {
    const Canvas = require('canvas');
    var Image = Canvas.Image,
      canvas = new Canvas(w, h),
      ctx = canvas.getContext('2d');

    if (arguments.length < 3) {
      throw new Error("Missing arguments");
    }

    const barColors = ["#3845ae", "#ffc200", "#8fa4af"];
    const cols = data.length;
    const generalScale = w / 500;
    const padding = paddingOverride || (generalScale * 24);
    const fontSize = Math.round(fontSizeOverride || (generalScale * 14));
    const fontHeight = Math.round(fontSize * 1.25);
    const colSize = ((w - ((cols - 1) * padding)) / cols);
    const cornerRadius = borderRadiusOverride || (generalScale * 4);
    const barHeight = h - (padding * 4);
    const spaceFromBottom = generalScale * 3;    
    const spacerSize = {
      w: Math.max(2, (generalScale * 3)),
      h: (padding * 0.6)
    };
    let leftPosition = 0;

    for (let c = 0; c < cols; c++) {
      this._roundedRectangle(ctx, lightColor, Math.round(leftPosition), 0, Math.round(colSize), barHeight, Math.round(cornerRadius));
      let thisBarHeight = data[c].quantityFilled * barHeight;
      this._roundedRectangle(ctx, barColors[c], Math.round(leftPosition), barHeight - thisBarHeight, Math.round(colSize), thisBarHeight, Math.round(cornerRadius));
      this._centerText(ctx, (fontSize * 1.2) + "px " + fontFace, data[c].dataLabel, darkerColor, leftPosition, (fontHeight * 1.5), colSize);
      this._centerText(ctx, fontSize + "px " + fontFace, data[c].subTitle, darkerColor, leftPosition, h - spaceFromBottom, colSize);
      this._centerText(ctx, "bold " + fontSize + "px " + fontFace, data[c].title, darkerColorLight, leftPosition, h - fontHeight - spaceFromBottom, colSize);
      ctx.fillStyle = lightColor;
      ctx.fillRect(Math.round(leftPosition + ((colSize - spacerSize.w) / 2)), ((h - (fontHeight * 2) - barHeight - spacerSize.h + (generalScale * 8)) / 2) + barHeight, spacerSize.w, spacerSize.h);
      leftPosition += colSize + padding;
    }

    return await this._canvasToPNGBufferAsync(canvas);
  }
};

// Expose it
module.exports = Charts;