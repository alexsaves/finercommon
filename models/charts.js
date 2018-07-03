const streamToBuffer = require('stream-to-buffer');
const fs = require('fs');
const path = require('path');
const fontFace = "Arial";
const lightColor = "#f3f3f3";
const darkerColorLight = "#424242";
const darkerColor = "#757575";
const darkGreen = "#4caf50";
const dudeImageURI = "data:image/png;base64,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";

var iconList = fs.readdirSync(__dirname + '/../assets/icons/');
const finalIconList = {};
for (let i = 0; i < iconList.length; i++) {
  var ext = path.extname(iconList[i]);
  if (ext == ".png") {
    var iconname = iconList[i].substr(0, iconList[i].indexOf('.'));
    finalIconList[iconname] = fs.readFileSync(__dirname + '/../assets/icons/' + iconList[i]);
  }
}

// Get the lanyard image
const lanyardImg = fs.readFileSync(__dirname + '/../assets/images/lanyard.png')

/**
 * Charting class
 */
class Charts {
  /**
   * Sets up a new charter
   */
  constructor() {}

  /**
   * Trim long strings
   * @param {String} str 
   * @param {Number} maxlen 
   */
  _trimLongStringsMiddle(str, maxlen) {
    if (str.length > maxlen) {
      var lendiff = str.length - maxlen - 3;
      var distFromEdge = Math.floor((str.length - lendiff) / 2);
      return str.substr(0, distFromEdge) + "..." + str.substr(str.length - distFromEdge);
    }
    return str;
  }

  /**
   * Split a string into an array of smaller strings
   * @param {String} str 
   * @param {Number} words 
   */
  _splitStringIntoParts(str, words) {
    var parts = [""];
    var bits = str.split(' ');
    var i = 0,
      run = 1;
    while (i < bits.length) {
      parts[parts.length - 1] += bits[i] + " ";
      if (run == words) {
        parts[parts.length - 1] = parts[parts.length - 1].trim();
        run = 0;
        parts.push("");
      }
      run++;
      i++;
    }
    if (parts[parts.length - 1] == "") {
      parts.splice(parts.length - 1, 1);
    }
    return parts;
  }

  /**
   * Make smart decisions about shortening a string
   * @param {String} str 
   */
  _smartShortenString(str) {
    if (str.indexOf("business") > -1) {
      str = str.replace(/business/g, '');
    }
    if (str.indexOf("relationship") > -1) {
      str = str.replace(/relationship/g, 'rltnshp.');
    }
    if (str.indexOf("Trusted") > -1) {
      str = str.replace(/Trusted/g, 'Trstd.');
    }
    return str.trim();
  }

  /**
   * Get an icon name based on a label
   */
  getIconNameForLabel(label) {
    var simpleStr = label.trim().toLowerCase();
    var iconName = "analytics";
    if (simpleStr.indexOf("business needs") > -1) {
      iconName = "notmeetneeds";
    } else if (simpleStr.indexOf("features") > -1) {
      iconName = "analytics";
    } else if (simpleStr.indexOf("external factors") > -1) {
      iconName = "externalfactors";
    } else if (simpleStr.indexOf("price") > -1) {
      iconName = "tag";
    } else if (simpleStr.indexOf("customer service") > -1) {
      iconName = "customerservice";
    } else if (simpleStr.indexOf("timeliness") > -1) {
      iconName = "timeliness";
    } else if (simpleStr.indexOf("budget") > -1) {
      iconName = "price";
    } else if (simpleStr.indexOf("other") > -1) {
      iconName = "other";
    } else if (simpleStr.indexOf("restructuring") > -1) {
      iconName = "connections";
    } else if (simpleStr.indexOf("frequency") > -1) {
      iconName = "frequency";
    } else if (simpleStr.indexOf("responsiveness") > -1) {
      iconName = "responsiveness";
    } else if (simpleStr.indexOf("valued partner") > -1) {
      iconName = "valuedpartner";
    } else if (simpleStr.indexOf("leadership") > -1) {
      iconName = "industryleader";
    } else if (simpleStr.indexOf("ease of doing business") > -1) {
      iconName = "connections";
    } else if (simpleStr.indexOf("long term success") > -1) {
      iconName = "success";
    } else if (simpleStr.indexOf("promises") > -1 || simpleStr.indexOf("commitments") > -1) {
      iconName = "promises";
    } else if (simpleStr.indexOf("quality") > -1) {
      iconName = "award";
    } else {
      console.log("ICON NOT KNOWN", simpleStr);
    }


    return iconName;
  }

  /**
   * Fit to size
   * @param {Number} w 
   * @param {Number} h 
   * @param {Number} targetW 
   * @param {Number} targetH 
   */
  _fitToSize(width, height, frame_width, frame_height) {
    var rectRatio = width / height;
    var boundsRatio = frame_width / frame_height;

    var newDimensions = {
      w: 0,
      h: 0
    };

    // Rect is more landscape than bounds - fit to width
    if (rectRatio > boundsRatio) {
      newDimensions.w = frame_width;
      newDimensions.h = height * (frame_width / width);
    }
    // Rect is more portrait than bounds - fit to height
    else {
      newDimensions.w = width * (frame_height / height);
      newDimensions.h = frame_height;
    }

    return newDimensions;
  }

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
    ctx.fillText(this._smartShortenString(rowData.label), x, y + fontHeight - (fontHeight * 0.3), (w / 2));
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
      let miniBarHeight = 0;
      if (data.monthOverMonthScores[i] > -1000) {
        miniBarHeight = Math.round(Math.min(1, Math.max(0, ((data.monthOverMonthScores[i] + 100) / 200))) * barHeight);
      }
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
      w: Math.max(2, (generalScale * 2)),
      h: (padding * 0.5)
    };
    let leftPosition = 0;

    for (let c = 0; c < cols; c++) {
      this._roundedRectangle(ctx, lightColor, Math.round(leftPosition), 0, Math.round(colSize), barHeight, Math.round(cornerRadius));
      let thisBarHeight = data[c].quantityFilled * barHeight;
      this._roundedRectangle(ctx, barColors[c], Math.round(leftPosition), barHeight - thisBarHeight, Math.round(colSize), thisBarHeight, Math.round(cornerRadius));
      this._centerText(ctx, (fontSize * 1.2) + "px " + fontFace, data[c].dataLabel, darkerColor, leftPosition, (fontHeight * 1.5), colSize);
      this._centerText(ctx, fontSize + "px " + fontFace, data[c].subTitle, darkerColor, leftPosition, h - spaceFromBottom, colSize);
      this._centerText(ctx, "bold " + fontSize + "px " + fontFace, this._trimLongStringsMiddle(data[c].title, 18), darkerColorLight, leftPosition, h - fontHeight - spaceFromBottom, colSize);
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
    var drawLabelAtPosition = function (pos, dataItem) {
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
        valign: p3.y > 0 ? "bottom" : "top"
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
  /**
   * Draw the rating stack chart Asynchronously
   * @param {Number} w 
   * @param {Number} scoreMax 
   * @param {Array} data 
   */
  async ratingStackAsync(w, scoreMax, data) {
    const generalScale = w / 500;
    const itemHeight = generalScale * 130;
    const topTitleFontSize = generalScale * 60;
    const padding = generalScale * 20;
    const fontSize = Math.round(generalScale * 14);
    const subFontSize = fontSize * 0.8;
    const colStart = padding * 5;
    const mainColWidth = w - padding - colStart;
    const squarePadding = generalScale * 5;
    const squareWidth = (mainColWidth - ((scoreMax - 1) * squarePadding)) / scoreMax
    const squareHeight = squareWidth * 0.9;
    const cornerRadius = generalScale * 7;

    const Canvas = require('canvas');
    var Image = Canvas.Image,
      canvas = new Canvas(w, itemHeight * data.length),
      ctx = canvas.getContext('2d');

    if (arguments.length < 3) {
      throw new Error("Missing arguments");
    }

    let topPosition = 0;
    let isBackground = false;
    let dudeImg = new Image();
    dudeImg.src = dudeImageURI;

    for (let i = 0; i < data.length; i++) {
      let row = data[i];
      if (isBackground) {
        isBackground = false;
      } else {
        isBackground = true;
      }
      if (isBackground) {
        ctx.fillStyle = lightColor;
        ctx.fillRect(0, topPosition, w, itemHeight);
      }

      // Draw the number
      ctx.fillStyle = darkerColorLight;
      ctx.font = topTitleFontSize + "px " + fontFace;
      ctx.textAlign = "left";
      ctx.fillText((i + 1) + ".", padding, topPosition + padding + topTitleFontSize);

      // Draw the label      
      ctx.fillStyle = darkerColorLight;
      ctx.font = "bold " + fontSize + "px " + fontFace;
      ctx.textAlign = "left";
      ctx.fillText(row.label, colStart, topPosition + padding + fontSize);

      // Draw the n-count
      if (row.n) {
        ctx.fillStyle = darkerColor;
        ctx.font = fontSize + "px " + fontFace;
        ctx.textAlign = "right";
        var res = ctx.measureText(row.n.toString());
        ctx.fillText(row.n, w - padding, topPosition + padding + fontSize);

        ctx.drawImage(dudeImg, w - padding - res.width - (fontSize * 1.1), topPosition + padding + (fontSize * 0.19), (fontSize * 0.8), (fontSize * 0.9));
      }

      // Do the value labels
      ctx.fillStyle = darkerColor;
      ctx.font = subFontSize + "px " + fontFace;
      ctx.textAlign = "left";
      ctx.fillText(row.lowLabel, colStart, topPosition + itemHeight - padding);
      ctx.textAlign = "right";
      ctx.fillText(row.highLabel, w - padding, topPosition + itemHeight - padding);

      // Do the scale
      let leftPosition = colStart;
      for (var c = 0; c < scoreMax; c++) {
        let rx = leftPosition;
        let ry = (generalScale * 3) + topPosition + Math.round((itemHeight - squareHeight) / 2);
        let rw = squareWidth;
        let rh = squareHeight;
        let percentSelected = 0;
        if (c + 1 < row.score) {
          percentSelected = 1;
          if (c + 2 > row.score) {
            percentSelected = 0.5;
          }
        }
        var labelColor = "#ffffff";
        if (percentSelected == 1) {
          labelColor = "#ffffff";
          this._roundedRectangle(ctx, darkGreen, rx, ry, rw, rh, cornerRadius);
        } else if (percentSelected == 0) {
          labelColor = darkGreen;
          this._roundedRectangle(ctx, darkGreen, rx, ry, rw, rh, cornerRadius);
          let pixPadding = Math.max(1, generalScale * 1);
          this._roundedRectangle(ctx, lightColor, rx + pixPadding, ry + pixPadding, rw - (2 * pixPadding), rh - (2 * pixPadding), cornerRadius);
        } else {
          labelColor = darkGreen;
          this._roundedRectangle(ctx, darkGreen, rx, ry, rw, rh, cornerRadius);
          let pixPadding = Math.max(1, generalScale * 1);
          this._roundedRectangle(ctx, "#A8DEB1", rx + pixPadding, ry + pixPadding, rw - (2 * pixPadding), rh - (2 * pixPadding), cornerRadius);
        }
        let labelSize = (squareHeight * 0.6);
        let xoffset = 0;
        if (c == 0) {
          xoffset = (generalScale * 3);
        }
        this._centerText(ctx, "bold " + labelSize + "px " + fontFace, (c + 1), labelColor, rx - xoffset, ry + (labelSize * 0.85) + ((squareHeight - labelSize) / 2), rw);

        leftPosition += squareWidth + squarePadding;
      }

      topPosition += itemHeight;
    }

    return await this._canvasToPNGBufferAsync(canvas);
  }

  /**
   * Get a three-across lanyard chat asynchronously
   * Example data:
   * [{
        icon: "customerservice",
        label: "Customer service",
        n: 10
      },
      {
        icon: "responsiveness",
        label: "Responsiveness",
        n: 7
      },
      {
        icon: "timeliness",
        label: "Timeliness of delivery",
        n: 1029
      }
    ]
   * @param {Number} w 
   * @param {Array} data 
   */
  async threeLanyardAsync(w, data) {
    while (data.length < 3) {
      data.push(null);
    }
    if (arguments.length != 2) {
      throw new Error("Invalid arguments");
    }
    const generalScale = w / 500;
    const lanyardHeight = generalScale * 200;
    const hasNCountLabel = !!data[0].n;
    const h = hasNCountLabel ? lanyardHeight + (generalScale * 70) : lanyardHeight;
    const padding = generalScale * 24;
    const fontSize = Math.round(generalScale * 14);
    const cols = data.length;
    const colSize = ((w - ((cols - 1) * padding)) / cols);
    const nlineWidth = Math.max(1, generalScale * 2);
    const nlineHeight = generalScale * 10;
    const Canvas = require('canvas');
    var Image = Canvas.Image,
      canvas = new Canvas(w, h),
      ctx = canvas.getContext('2d');

    const lanImg = new Image();
    lanImg.src = lanyardImg;

    let leftPosition = 0;
    for (let c = 0; c < data.length; c++) {
      let row = data[c];
      if (row === null) {
        continue;
      }
      let xoffset = c === 0 ? (generalScale * -2) : 0;
      ctx.drawImage(lanImg, leftPosition, 0, colSize, lanyardHeight);
      this._centerText(ctx, "bold " + fontSize + "px " + fontFace, (c + 1).toString(), darkerColorLight, leftPosition + xoffset, (generalScale * 5) + fontSize, colSize);

      // Write the label
      const labelY = (generalScale * 40) + fontSize;
      const labelparts = this._splitStringIntoParts(row.label, 2);
      if (labelparts.length == 1) {
        this._centerText(ctx, "bold " + (fontSize * 0.85) + "px " + fontFace, labelparts[0], darkerColorLight, leftPosition, labelY, colSize);
      } else {
        let yofs = -(fontSize / 2);
        for (let p = 0; p < labelparts.length; p++) {
          this._centerText(ctx, "bold " + (fontSize * 0.85) + "px " + fontFace, labelparts[p], darkerColorLight, leftPosition, labelY + yofs, colSize);
          yofs += (fontSize);
        }
      }

      // Load the icon
      var icn = finalIconList[row.icon];
      if (!icn) {
        throw new Error("Invalid icon: " + row.icon);
      }
      var iconImg = new Image();
      iconImg.src = icn;
      var newSize = this._fitToSize(iconImg.width, iconImg.height, colSize - padding - padding, lanyardHeight - labelY - padding - padding - padding);
      var iconX = ((colSize - newSize.w) / 2) + leftPosition;
      var iconY = ((lanyardHeight - labelY - newSize.h) / 2) + labelY - (padding * 0.3);
      ctx.drawImage(iconImg, iconX, iconY, newSize.w, newSize.h);

      // If there is an N count, show it
      if (hasNCountLabel) {
        ctx.fillStyle = lightColor;
        let lineypos = lanyardHeight + (padding);
        ctx.fillRect(Math.round(leftPosition + ((colSize - nlineWidth) / 2)), Math.round(lineypos), Math.round(nlineWidth), Math.round(nlineHeight));
        ctx.fillStyle = darkerColor;
        this._centerText(ctx, fontSize + "px " + fontFace, row.n + " respondents", darkerColor, leftPosition, lineypos + nlineHeight + padding + (fontSize * 0.4), colSize);
      }

      leftPosition += colSize + padding;
    }

    return await this._canvasToPNGBufferAsync(canvas);
  }
};

// Expose it
module.exports = Charts;