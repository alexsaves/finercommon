const dbcmd = require('../../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const survey = require('../survey');
const SurveyValueExtractor = require('../surveyvalueextractor');
const ResponseCollection = require('../responsecollection');
const Response = require('../response');
const Respondent = require('../respondent');

/**
 * The general report class (ASYNC)
 * @param {*} cfg 
 * @param {*} orgid 
 * @param {*} startdate 
 * @param {*} enddate 
 */
var RunReportAsync = async function (cfg, orgid, startdate, enddate) {
  // First get all the customer surveys
  let svs = await survey.GetForOrganizationAndTypeAsync(cfg, orgid, survey.SURVEY_TYPES.PROSPECT);
  console.log("Surveys: ", svs.length);
  return svs;
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

// Expose it
module.exports = GeneralReport;