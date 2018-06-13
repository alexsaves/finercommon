const Surveyvalueextractor = require('../models/surveyvalueextractor');
const md5 = require('md5');

/**
 * All the weightings for BuyX
 */
const BuyXWeightings = [{
    segment: "Overall",
    questions: ["buyXRating"],
    weight: 0.25
  },
  {
    segment: "Buying Criteria",
    questions: ["howWellInAreas[0]", "howWellInAreas[1]", "howWellInAreas[2]"],
    weight: 0.3
  },
  {
    segment: "Product/ Service Offering",
    questions: ["rateWinningVendor[0]", "rateWinningVendor[1]", "rateWinningVendor[2]", "rateWinningVendor[3]", "rateWinningVendor[4]"],
    weight: 0.2
  },
  {
    segment: "Connection Score",
    questions: ["reconnect"],
    weight: 0.25
  },
];

// Get the value
const ValueExtractor = new Surveyvalueextractor();

// Expose
module.exports = {
  /**
   * Get a response from a list of responses
   */
  GetResponse: function (qname, resps, surveydef) {
    var res = ValueExtractor.getSurveyQuestionValue(qname, resps, surveydef, {}, {});
    return res;
  },

  /**
   * Get a buyX Score. -1 is no score possible
   */
  CalculateBuyXFromResponses: function (surveydef, responses) {
    let overallScore = 0;
    for (let i = 0; i < BuyXWeightings.length; i++) {
      let weighting = BuyXWeightings[i];
      let itemsInGroup = 0;
      let runningtally = 0;
      for (let q = 0; q < weighting.questions.length; q++) {
        let ans = this.GetResponse(weighting.questions[q], responses, surveydef.survey_model.pages);
        if (ans != null) {
          itemsInGroup++;
          runningtally += ans;
        }
      }
      if (itemsInGroup == 0) {
        return;
      }
      overallScore += (runningtally / itemsInGroup) * weighting.weight;
    }
    if (isNaN(overallScore)) {
      throw new Error("Invalid BuyX Score");
    }
    return ((overallScore - 1) / 6) * 100;
  }
};