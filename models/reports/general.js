const dbcmd = require('../../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const survey = require('../survey');
const SurveyValueExtractor = require('../surveyvalueextractor');
const ResponseCollection = require('../responsecollection');
const Response = require('../response');
const Respondent = require('../respondent');
const BuyX = require('../buyx');
const Approval = require('../approval');
const CRMOpportunities = require('../crmopportunities');

/**
 * Fix up labels to be more presentable
 * @param {*} str 
 */
var ShortCleanupOnLabels = function(str) {
  if (str == "__other__") {
    return "Other";
  } else {
    if (str.indexOf("External") > -1 && str.indexOf("(") > -1) {
      return str.split("(")[0].trim();
    } else if (str.indexOf("features") > -1) {
      return "Features";
    } else if (str.indexOf("business needs") > -1) {
      return "Misses business needs";
    }
  }
  return str;
};

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
      // svs[i].respondents[j].responses = await
      // Response.GetByRespondentAndSurveyAsync(cfg, svs[i].respondents[j].id,
      // svs[i].guid);
      svs[i].respondents[j].survey = svs[i];
      svs[i].respondents[j].buyX = BuyX.CalculateBuyXFromResponses(svs[i], svs[i].respondents[j].answers);
      respondentArr.push(svs[i].respondents[j]);
      resultObject.buyX += svs[i].respondents[j].buyX;
    }
  }

  // Only proceed if we have data
  if (respondentArr.length > 0) {
    resultObject.buyX /= respondentArr.length;
  }

  // Compute reasons for loss
  let reasonsForLoss = [];

  // Tally them up
  for (let i = 0; i < respondentArr.length; i++) {
    let resp = respondentArr[i],
      answers = resp.answers,
      surveymodel = resp.survey.survey_model;

    // Get the question definition from this survey for the key question
    let questionDef = exter._locateQuestionObjectForName("whyNotSelected", surveymodel.pages);

    // Proceed if we have everything
    if (questionDef && answers.whyNotSelected && answers.whyNotSelected.responses && answers.whyNotSelected.responses.length > 0) {
      //console.log("Looking at", answers.whyNotSelected);
      //console.log("def", questionDef);
      let choices = questionDef.choices;
      let resps = answers.whyNotSelected.responses;
      for (let j = 0; j < resps.length; j++) {
        if (resps[j] == 9999) {
          // OTHER
          let otherval = reasonsForLoss.find((vl) => {
            return vl.label === "__other__";
          });
          if (otherval == null) {
            otherval = {
              label: "__other__",
              shortLabel: ShortCleanupOnLabels("__other__"),
              count: 0,
              responses: []
            };
            reasonsForLoss.push(otherval);
          }
          otherval.count++;
          let otheroo = answers.whyNotSelected.other;          
          if (typeof(otheroo) != "undefined" && otheroo.trim().length > 0) {
            if (!otherval.responses.find((vl) => {
              return vl == answers.whyNotSelected;
            })) {
              otherval.responses.push(otheroo.trim());
            }
          }
        } else {
          if (choices.length > resps[j]) {
            // Tally it up
            let val = choices[resps[j]];
            let existingEntry = reasonsForLoss.find((vl) => {
              return vl.label == val;
            });
            if (!existingEntry) {
              existingEntry = {
                label: val,
                shortLabel: ShortCleanupOnLabels(val),
                count: 0
              };
              reasonsForLoss.push(existingEntry);
            }
            existingEntry.count++;
          } else {
            // Option no longer exists??
            console.log("Option doesnt exist! hm..");
          }
        }
      }
      resultObject.reasonsForLoss = reasonsForLoss.sort((a, b) => {
        if (a.count < b.count) {
          return 1;
        } else if (a.count > b.count) {
          return -1;
        } else {
          return 0;
        }
      });
    }
  }

  // First, get info about the opportunities and approvals referenced by these respondents
  var uniqueOpportunities = {};
  var uniqueApprovals = {};
  respondentArr.forEach((resp) => {
    if (resp.approval_guid && resp.approval_guid.trim().length > 0) {
      uniqueApprovals[resp.approval_guid] = true;
    }
  });
  uniqueApprovals = Object.keys(uniqueApprovals);
  uniqueApprovals = await Approval.GetListAsync(cfg, uniqueApprovals);
  uniqueApprovals.forEach((opp) => {
    if (opp.opportunity_id) {
      uniqueOpportunities[opp.opportunity_id] = true;
    }
  });
  uniqueOpportunities = Object.keys(uniqueOpportunities);
  uniqueOpportunities = await CRMOpportunities.GetListAsync(cfg, uniqueOpportunities);

  // Set up competitors object
  var competitorInfo = [];

  // Extract the competitors and their lost dollars
  
  console.log("OPPS:", uniqueOpportunities);

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
module.exports = {
  GeneralReport,
  GeneralReportAsync
}