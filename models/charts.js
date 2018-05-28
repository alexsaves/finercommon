const streamToBuffer = require('stream-to-buffer');

const fontFace = "Arial";
const lightColor = "#f3f3f3";
const darkerColorLight = "#424242";
const darkerColor = "#757575";
const darkGreen = "#4caf50";

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
   * Rotate a coordinate around its axis
   * @param {Number} x 
   * @param {Number} y 
   * @param {Number} angle Angle in degrees
   */
  _rotate(x, y, angle) {
    var radians = (Math.PI / 180) * angle,
      cos = Math.cos(radians),
      sin = Math.sin(radians),
      nx = (cos * (x - 0)) + (sin * (y - 0)) + 0,
      ny = (cos * (y - 0)) - (sin * (x - 0)) + 0;
    return {
      x: nx,
      y: ny
    };
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
      if (i + 1 <= rowData.score) {
        ctx.fillStyle = barColor;
      }
      ctx.fillRect(leftPosition + x, y + barYOffset, barWidth, barHeight);
      leftPosition += barWidth + padding;
    }
  }

  /**
   * Draws the buyX score region
   * Sample Data:
   * {
     leftLabel: "This month",
     leftScore: 98.3,
     subTitle: "+0.1 than Nov",
     rightLabel: "BuyX Score® Trend",
     startDateLabel: "11/30/2017",
     endDateLabel: "01/31/2018",
     monthOverMonthScores: [
       98, 65, 30, 50, 12, 4, 68, 75, 70, 90, 87, 98.3
     ],
     scoresInLastYear: 4
   }
   * @param {Number} w 
   * @param {Number} h 
   * @param {Object} data 
   */
  async buyXScoreAsync(w, h, data) {
    const Canvas = require('canvas');
    var Image = Canvas.Image,
      canvas = new Canvas(w, h),
      ctx = canvas.getContext('2d');

    if (arguments.length < 3) {
      throw new Error("Missing arguments");
    }

    const generalScale = w / 500;
    const padding = (generalScale * 24);
    const fontSize = Math.round(generalScale * 14);
    const fontHeight = Math.round(fontSize * 1.25);
    const topTitleFontSize = generalScale * 14;
    const titleFontHeight = Math.round(topTitleFontSize * 1.0);
    const columnWidth = (w - padding) / 2;
    const rightColumnX = columnWidth + padding;
    const subtitleFont = generalScale * 11;
    const scoreFontSize = (h / 290) * 150;
    const cols = data.monthOverMonthScores.length;
    const barWidth = columnWidth / ((cols * 2) - 1);
    const barHeight = h - topTitleFontSize - fontHeight - padding - padding;
    const barY = Math.round((h - barHeight) / 2);

    // First do the titles
    ctx.font = "bold " + topTitleFontSize + "px " + fontFace;
    ctx.fillStyle = darkerColorLight;
    ctx.textAlign = "left";
    ctx.fillText(data.leftLabel, 0, titleFontHeight, columnWidth);
    ctx.fillText(data.rightLabel, rightColumnX, titleFontHeight, columnWidth);

    // Do sub-labels
    ctx.font = subtitleFont + "px " + fontFace;
    ctx.fillStyle = darkerColorLight;
    ctx.textAlign = "left";
    ctx.fillText(data.subTitle, 0, h - (generalScale * subtitleFont * 0.1), columnWidth);
    ctx.fillText(data.startDateLabel, rightColumnX, h - (generalScale * subtitleFont * 0.1), columnWidth);
    ctx.textAlign = "right";
    ctx.fillText(data.endDateLabel, w, h - (generalScale * subtitleFont * 0.1), columnWidth);

    // Do the score
    let leftScoreStr = data.leftScore.toString();
    if (leftScoreStr.length > 4) {
      leftScoreStr = leftScoreStr.substr(0, 4);
    }
    ctx.fillStyle = darkGreen;
    ctx.textAlign = "left";
    ctx.font = "bold " + scoreFontSize + "px " + fontFace;
    ctx.fillText(leftScoreStr, 0, h - (generalScale * subtitleFont) - padding, columnWidth);

    // Bar chart
    let leftPosition = rightColumnX;
    for (let i = 0; i < cols; i++) {
      ctx.fillStyle = lightColor;
      ctx.fillRect(leftPosition, barY, barWidth, barHeight);
      if ((i + 1) > data.scoresInLastYear) {
        ctx.fillStyle = darkGreen;
      } else {
        ctx.fillStyle = darkerColor;
      }
      let miniBarHeight = Math.round(Math.min(1, Math.max(0, ((data.monthOverMonthScores[i] + 100) / 200))) * barHeight);
      ctx.fillRect(leftPosition, barY + (barHeight - miniBarHeight), barWidth, miniBarHeight);

      leftPosition += barWidth + barWidth;
    }
    return await this._canvasToPNGBufferAsync(canvas);
  }

  /**
   * Draw a score strip
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

  /**
   * Draw a pie
   * Sample data:
   * [
      {
        label: "Hot",
        quantity: 34.3        
      },
      {
        label: "Warm",
        quantity: 21.9        
      },
      {
        label: "Cold",
        quantity: (100 - 34.3 - 21.9)        
      }
    ]
   * @param {Canvas} ctx 
   * @param {Number} x 
   * @param {Number} y 
   * @param {Number} w 
   * @param {Number} h 
   * @param {Object} data 
   * @param {Number} fontSize
   */
  _pieChart(ctx, x, y, w, h, data, fontSize, generalScale) {
    const pieColors = [darkGreen, "#c3cdd4", "#8fa4af", darkerColor];
    const minXPadding = fontSize * 2;
    const minYPadding = fontSize * 2;
    let pieRadius = Math.min(w - minXPadding - minXPadding, h - minYPadding - minYPadding) / 2;
    const pieX = Math.round(((w) / 2) + x);
    const pieY = Math.round(((h) / 2) + y);
    const pointerLength = generalScale * 7;
    const pointerCoords = {
      x1: pieRadius,
      y1: 0,
      x2: pieRadius + pointerLength,
      y2: 0,
      x3: pieRadius + pointerLength + pointerLength,
      y3: 0
    };
    const textLabelWidth = fontSize * 2.2;
    const textLabelHeight = fontSize * 1.7;

    // Enforce a maximum of 3 pie segments
    if (data.length > 3) {
      data.length = 3;
    }
    //ctx.fillStyle = darkerColorLight;
    //ctx.fillRect(x, y, w, h);

    /**
     * Draw a label
     * @param {Position} pos 
     * @param {Object} dataItem 
     */
    var drawLabelAtPosition = function(pos, dataItem) {
      let scoreLabel = dataItem.quantity.toString();
      if (scoreLabel.length > 4) {
        scoreLabel = scoreLabel.substr(0, 4);
      }
      scoreLabel += "%";
      ctx.font = (fontSize * 0.75) + "px " + fontFace;
      ctx.fillStyle = darkerColor;
      ctx.strokeStyle = darkerColor;
      ctx.textAlign = pos.align;
      let realX = pos.x + pieX;
      let realY = pos.y + pieY + fontSize;
      if (pos.align == "left") {
        realX -= textLabelWidth;
        realX = Math.max(0, realX);
      } else {
        realX += textLabelWidth;
        realX = Math.min(realX, x + w);
      }
      if (pos.valign == "top") {
        realY -= textLabelHeight;        
      }
      realY = Math.min(realY, y + h - textLabelHeight);
      realY = Math.max(y + fontSize, realY);
      
      ctx.fillText(dataItem.label, realX, realY);
      ctx.fillText(scoreLabel, realX, realY + fontSize);
    };

    const myTotal = 100;
    let lastend = 0;
    let lastRotation = 0;
    for (var i = 0; i < data.length; i++) {
      ctx.fillStyle = pieColors[i];
      ctx.beginPath();
      ctx.moveTo(pieX, pieY);
      // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
      ctx.arc(pieX, pieY, pieRadius, lastend, lastend + (Math.PI * 2 * (data[i].quantity / myTotal)), false);
      ctx.lineTo(pieX, pieY);
      ctx.fill();

      // Draw the pointer line
      let rotationCoords = ((((data[i].quantity / 2) + lastRotation) / myTotal) * -360);
      let p1 = this._rotate(pointerCoords.x1, pointerCoords.y1, rotationCoords);
      let p2 = this._rotate(pointerCoords.x2, pointerCoords.y2, rotationCoords);
      let p3 = this._rotate(pointerCoords.x3, pointerCoords.y3, rotationCoords);

      let textPosition = {
        x: p3.x,
        y: p3.y,
        align: p3.x > 0 ? "right" : "left",
        valign: p3.y > 0 ? "bottom": "top"
      };

      drawLabelAtPosition(textPosition, data[i]);

      ctx.lineWidth = Math.max(1, Math.round(generalScale * 1));
      ctx.strokeStyle = darkerColor;
      ctx.beginPath();
      ctx.moveTo(p1.x + pieX, p1.y + pieY);
      ctx.lineTo(p2.x + pieX, p2.y + pieY);
      ctx.stroke();
      lastRotation += data[i].quantity;
      lastend += Math.PI * 2 * (data[i].quantity / myTotal);
    }
  }

  /**
   * Compute the net connector score asynchronously
   * Sample data:
   * {
    leftLabel: "Net Connector Score®",
    rightLabel: "Future Lead Sentiment",
    leftSubLabel: "This month",
    leftDiffLabel: "-0.9 than Nov",
    leftScore: 76.2,
    sentimentPie: [
      {
        label: "Hot",
        quantity: 34.3        
      },
      {
        label: "Warm",
        quantity: 21.9        
      },
      {
        label: "Cold",
        quantity: (100 - 34.3 - 21.9)        
      }
    ]
  }
   * @param {Number} w 
   * @param {Number} h 
   * @param {Object} data 
   */
  async netConnectorChartAsync(w, h, data) {
    const Canvas = require('canvas');
    var Image = Canvas.Image,
      canvas = new Canvas(w, h),
      ctx = canvas.getContext('2d');

    if (arguments.length < 3) {
      throw new Error("Missing arguments");
    }

    const generalScale = w / 500;
    const padding = (generalScale * 24);
    const fontSize = Math.round(generalScale * 14);
    const fontHeight = Math.round(fontSize * 1.25);
    const topTitleFontSize = generalScale * 14;
    const titleFontHeight = Math.round(topTitleFontSize * 1.0);
    const columnWidth = (w - padding) / 2;
    const rightColumnX = columnWidth + padding;
    const subtitleFont = generalScale * 11;
    const scoreFontSize = (h / 290) * 110;
    const ratingChartHeight = generalScale * 20;
    const cornerRadius = Math.max(2, generalScale * 7);
    const scoreFontHeight = Math.round(scoreFontSize * 0.9);

    // First do the titles
    ctx.font = "bold " + topTitleFontSize + "px " + fontFace;
    ctx.fillStyle = darkerColorLight;
    ctx.textAlign = "left";
    ctx.fillText(data.leftLabel, 0, titleFontHeight, columnWidth);
    ctx.fillText(data.rightLabel, rightColumnX, titleFontHeight, columnWidth);

    // Do the rating chart below
    ctx.font = fontSize + "px " + fontFace;
    ctx.fillStyle = darkerColor;
    ctx.textAlign = "left";
    ctx.fillText("-100", 0, h, columnWidth);
    ctx.textAlign = "right";
    ctx.fillText(100, columnWidth, h, columnWidth);
    const ratingY = h - fontHeight - (0.1 * ratingChartHeight) - ratingChartHeight;
    this._roundedRectangle(ctx, lightColor, 0, ratingY, columnWidth, ratingChartHeight, cornerRadius);
    ctx.fillStyle = darkerColorLight;
    ctx.fillRect(Math.round(columnWidth / 2) - 2, ratingY, 4, ratingChartHeight);
    const scoreX = Math.round(Math.min(1, Math.max(0, (data.leftScore + 100) / 200)) * columnWidth);
    ctx.fillStyle = darkGreen;
    ctx.fillRect(scoreX - 4, ratingY - (0.2 * ratingChartHeight), 8, ratingChartHeight + (0.2 * ratingChartHeight * 2));

    // Do the big score and accompanying label
    ctx.font = fontSize + "px " + fontFace;
    ctx.fillStyle = darkerColor;
    ctx.textAlign = "left";
    const subLabelY = ratingY - fontHeight + (fontHeight * 0.15);
    ctx.fillText(data.leftDiffLabel, 0, subLabelY, columnWidth);

    let leftScoreStr = data.leftScore.toString();
    if (leftScoreStr.length > 4) {
      leftScoreStr = leftScoreStr.substr(0, 4);
    }
    ctx.fillStyle = darkGreen;
    ctx.textAlign = "left";
    ctx.font = "bold " + scoreFontSize + "px " + fontFace;
    const scoreY = subLabelY - (fontHeight * 1.2);
    ctx.fillText(leftScoreStr, 0, scoreY, columnWidth);
    ctx.font = "bold " + topTitleFontSize + "px " + fontFace;
    ctx.fillStyle = darkerColorLight;
    ctx.textAlign = "left";
    ctx.fillText(data.leftSubLabel, 0, scoreY - scoreFontHeight, columnWidth);

    // Do the pie chart
    this._pieChart(ctx, rightColumnX, fontHeight * 1.2, columnWidth, h - fontHeight, data.sentimentPie, fontSize, generalScale);

    return await this._canvasToPNGBufferAsync(canvas);
  }
};

// Expose it
module.exports = Charts;