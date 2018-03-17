const dbcmd = require('../../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const survey = require('../survey');
const SurveyValueExtractor = require('../surveyvalueextractor');
const ResponseCollection = require('../responsecollection');
const Response = require('../response');
const Respondent = require('../respondent');
const BuyX = require('../buyx');

/**
 * The general report class (ASYNC)
 * @param {*} cfg
 * @param {*} orgid
 * @param {*} startdate
 * @param {*} enddate
 */
var RunReportAsync = async function (cfg, orgid, startdate, enddate) {
  // This will hold the final result
  var resultObject = {};

  // Set up a survey value extractor
  let exter = new SurveyValueExtractor();

  // First get all the customer surveys
  let svs = await survey.GetForOrganizationAndTypeAsync(cfg, orgid, survey.SURVEY_TYPES.PROSPECT);

  // A flat array of respondents with their surveys
  let respondentArr = [];

  // Start computing buyX
  resultObject.buyX = 0;

  // First compute the buyX score for all responses
  for (let i = 0; i < svs.length; i++) {
    svs[i].respondents = await Respondent.GetBySurveyAndTimeRangeAsync(cfg, svs[i].guid, startdate, enddate);
    for (let j = 0; j < svs[i].respondents.length; j++) {
      //svs[i].respondents[j].responses = await Response.GetByRespondentAndSurveyAsync(cfg, svs[i].respondents[j].id, svs[i].guid);      
      svs[i].respondents[j].buyX = BuyX.CalculateBuyXFromResponses(svs[i], svs[i].respondents[j].answers);
      respondentArr.push(svs[i].respondents[j]);
      resultObject.buyX += svs[i].respondents[j].buyX;
    }
  }

  // Only proceed if we have data
  if (respondentArr.length > 0) {
    resultObject.buyX /= respondentArr.length;
  }

  // Return the result array
  return resultObject;
};

/**
* The general report class
*/
var GeneralReport = function (cfg, orgid, startdate, enddate, cb) {
  RunReportAsync(cfg, orgid, startdate, enddate).then((res) => {
    cb(null, res);
  }).catch((err) => {
    cb(err);
  });
};

/**
* The general report class ASYNC
*/
var GeneralReportAsync = function (cfg, orgid, startdate, enddate) {
  return new Promise((resolve, reject) => {
    GeneralReport(cfg, orgid, startdate, enddate, (err, rep) => {
      if (err) {
        reject(err);
      } else {
        resolve(rep);
      }
    });
  });
};

// Expose it
module.exports = { GeneralReport, GeneralReportAsync }