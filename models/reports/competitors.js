const moment = require('moment');
const TimeAgo = require('javascript-time-ago');
const TimeAgoEn = require('javascript-time-ago/locale/en');
const survey = require('../survey');
const respondent = require('../respondent');
const Survey = require('../survey');
const SurveyValueExtractor = require('../surveyvalueextractor');
const OrgReportCache = require('../orgreportcache');
const CodifyReasonForLoss = require('./general').CodifyReasonForLoss;
const Approval = require('../approval');

/**
 * Respondent Type Filter
 */
const RespondentType = {
  "PROSPECT": 0,
  "INTERNAL": 1,
  "ALL": 2
};

/**
 * Get the breakdown of competition for the time period
 * @param {*} cfg 
 * @param {Organization} org 
 * @param {Date} mStartdate Exclusive start date (MOMENT)
 * @param {Date} mEnddate Inclusive end date (MOMENT)
 */
const GetCompetitionBreakdownForPeriod = async function (cfg, org, mStartdate, mEnddate) {
  var resultObject = {
    startDate: mStartdate.unix(),
    endDate: mEnddate.unix(),
    org: org.id,
    prospectCompetition: await GetCompetitionBreakdownForPeriodForRespType(cfg, org, mStartdate, mEnddate, RespondentType.PROSPECT),
    internalCompetition: await GetCompetitionBreakdownForPeriodForRespType(cfg, org, mStartdate, mEnddate, RespondentType.INTERNAL),
    aggregateCompetition: await GetCompetitionBreakdownForPeriodForRespType(cfg, org, mStartdate, mEnddate, RespondentType.ALL)
  };
  return resultObject;
};

/**
 * Get the breakdown of competition for the time period
 * @param {*} cfg 
 * @param {Organization} org 
 * @param {Date} mStartdate Exclusive start date (MOMENT)
 * @param {Date} mEnddate Inclusive end date (MOMENT)
 * @param {resptype} Number Respondent Type
 */
const GetCompetitionBreakdownForPeriodForRespType = async function (cfg, org, mStartdate, mEnddate, resptype = 0) {
  // This will hold the final result
  var resultObject = {
    startDate: mStartdate.unix(),
    endDate: mEnddate.unix(),
    org: org.id,
    respType: resptype,
    respTypeStr: Object.keys(RespondentType)[resptype]
  };

  let ShortCleanupOnLabels = require('./general').ShortCleanupOnLabels;
  const CRMOpportunities = require('../crmopportunities');

  // Set up a survey value extractor
  let exter = new SurveyValueExtractor();

  // First get all the customer surveys
  let svs = await survey.GetForOrganizationAndTypeAsync(cfg, org.id, survey.SURVEY_TYPES.PROSPECT);
  let esvs = await survey.GetForOrganizationAndTypeAsync(cfg, org.id, survey.SURVEY_TYPES.EMPLOYEE);
  let allSvs = svs.concat(esvs);
  if (resptype == RespondentType.PROSPECT) {
    allSvs = svs.slice(0);
  } else if (resptype == RespondentType.INTERNAL) {
    allSvs = esvs.slice(0);
  }

  let prospectResps = await respondent.GetBySurveysAndTimeRangeAsync(cfg, svs.map(sv => sv.guid), mStartdate.toDate(), mEnddate.toDate());
  let employeeResps = await respondent.GetBySurveysAndTimeRangeAsync(cfg, esvs.map(sv => sv.guid), mStartdate.toDate(), mEnddate.toDate());

  prospectResps.forEach(r => {
    r.isProspect = true;
  });

  employeeResps.forEach(r => {
    r.isProspect = false;
  });

  let respondentArr = prospectResps.concat(employeeResps);
  if (resptype == RespondentType.PROSPECT) {
    respondentArr = prospectResps.slice(0);
  } else if (resptype == RespondentType.INTERNAL) {
    respondentArr = employeeResps.slice(0);
  }

  respondentArr.forEach(r => {
    r.survey = allSvs.find(s => {
      return s.guid == r.survey_guid;
    })
  });
  respondentArr = respondentArr.sort(function (a, b) {
    if (a.created_at > b.created_at) {
      return -1;
    } else if (a.created_at < b.created_at) {
      return 1;
    } else {
      return 0;
    }
  });
  prospectResps = null;
  employeeResps = null;

  // First, get info about the opportunities and approvals referenced by these
  // respondents
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

  // Now make decisions about who actually won each opportunity
  for (let i = 0; i < uniqueOpportunities.length; i++) {
    // Quickreference the opportunity
    let theOpp = uniqueOpportunities[i];

    // Iterate over the surveys for this opportunity
    let surveysForOpp = await Survey.GetForOpportunityAndTypeAsync(cfg, theOpp.id, Survey.SURVEY_TYPES.PROSPECT);
    let surveysForOppEmp = await Survey.GetForOpportunityAndTypeAsync(cfg, theOpp.id, Survey.SURVEY_TYPES.EMPLOYEE);
    surveysForOpp = surveysForOpp.concat(surveysForOppEmp);
    theOpp.surveys = surveysForOpp;

    // Get all the respondents for each opportunity
    var approvalsForOpp = uniqueApprovals.filter((apr) => {
      return apr.opportunity_id == theOpp.id;
    });
    theOpp.approvals = approvalsForOpp;
    var opportunityResps = respondentArr.filter((rep) => {
      return !!surveysForOpp.find((sv) => {
        return sv.guid == rep.survey_guid;
      });
    });
    theOpp.respondents = opportunityResps;

    // Now do the piping for each respondent and survey so we know what they
    // actually said
    opportunityResps.forEach((rep) => {
      let svForRep = surveysForOpp.find((sv) => {
        return sv.guid == rep.survey_guid;
      });
      if (svForRep) {
        rep.survey_model = svForRep.getPipedModel(rep);
      }
    });

    // Now find out who won according to each person
    let orgVotes = [];

    // Loop over each respondent and tally up the votes
    opportunityResps.forEach((resp) => {
      let vendorRankings = resp.answers.vendorRankings;
      // Only proceed if the user answered the question
      if (vendorRankings && vendorRankings.order && vendorRankings.order.length > 0) {
        let vendorQuestion = exter._locateQuestionObjectForName("vendorRankings", resp.survey_model.pages);
        let winningVendorId = vendorRankings.order[0];
        if (winningVendorId == 9999) {
          // OTHER
          let otherval = orgVotes.find((vl) => {
            return vl.label === "__other__";
          });
          if (otherval == null) {
            otherval = {
              label: "__other__",
              shortLabel: ShortCleanupOnLabels("__other__"),
              count: 0,
              responses: []
            };
            orgVotes.push(otherval);
          }
          let otheroo = vendorRankings.other;
          if (typeof (otheroo) != "undefined" && otheroo.trim().length > 0) {
            if (!otherval.responses.find((vl) => {
              return vl == otheroo;
            })) {
              otherval
                .responses
                .push({ id: resp.id, p: resp.isProspect, txt: otheroo.trim(), sv: resp.survey.guid });
            }
          }
        } else {
          // REAL Tally it up
          let val = vendorQuestion.choices[winningVendorId];
          let existingEntry = orgVotes.find((vl) => {
            return vl.label == val;
          });
          if (!existingEntry) {
            existingEntry = {
              label: val,
              shortLabel: ShortCleanupOnLabels(val),
              count: 0
            };
            orgVotes.push(existingEntry);
          }
        }
      }
    });

    // Sort orgVotes
    orgVotes = orgVotes.sort((a, b) => {
      if (a.count < b.count) {
        return 1;
      } else if (a.count > b.count) {
        return -1;
      } else {
        return 0;
      }
    });

    // Now we have a sorted list
    if (orgVotes.length > 0) {
      var winningVendor = orgVotes[0];
      winningVendor.Amount = theOpp ?
        theOpp.Amount :
        0;
      theOpp.winningVendor = winningVendor;
    }

    // Merge with the master list
    if (winningVendor) {
      winningVendor.count++;
      var existingItem = competitorInfo.find((og) => {
        return og.label == winningVendor.label;
      });
      if (!existingItem) {
        competitorInfo.push(winningVendor);
      } else {
        existingItem.Amount += winningVendor.Amount;
        existingItem.count += winningVendor.count;
        // Is it "other"?
        if (existingItem.label == "__other__") {
          // Merge the responses
          for (let g = 0; g < winningVendor.responses.length; g++) {
            if (!existingItem.responses.find((rp) => {
              return rp == winningVendor.responses[g];
            })) {
              existingItem
                .responses
                .push(winningVendor.responses[g]);
            }
          }
        }
      }
    }
  }


  // Sort the list
  competitorInfo = competitorInfo.sort((a, b) => {
    if (a.Amount < b.Amount) {
      return 1;
    } else if (a.Amount > b.Amount) {
      return -1;
    } else {
      return 0;
    }
  });

  // Now we find the reasons WHY people chose each vendor
  for (let h = 0; h < competitorInfo.length; h++) {
    let competitor = competitorInfo[h];

    // Find the responses that chose this competitor
    let competitorResps = respondentArr.filter((resp) => {
      let vendorRankings = resp.answers.vendorRankings;
      // Only proceed if the user answered the question
      if (vendorRankings && vendorRankings.order && vendorRankings.order.length > 0) {
        if (!resp.survey_model && resp.survey) {
          resp.survey_model = resp.survey.survey_model;
        }
        let vendorQuestion = exter._locateQuestionObjectForName("vendorRankings", resp.survey_model.pages);
        let winningVendorId = vendorRankings.order[0];
        if (winningVendorId == 9999) {
          // OTHER
          return competitor.label == "__other__";
        } else {
          let winningVendorName = vendorQuestion.choices[winningVendorId];
          return winningVendorName == competitor.label;
        }
      }
      return false;
    });

    // Only proceed if there ARE people, which there should be
    if (competitorResps.length > 0) {
      // Now create a holder for the reasons
      let sampleReasonsQuestion = exter._locateQuestionObjectForName("reasonsWhyWinnerChosen", competitorResps[0].survey_model.pages);
      let sampleReasons = JSON.parse(JSON.stringify(sampleReasonsQuestion.choices));

      // Now create a tally object for those choices
      var choicesTallyObject = sampleReasons.map((sr) => {
        return {
          label: sr,
          shortLabel: ShortCleanupOnLabels(sr),
          count: 0
        };
      });
      var otherReason = {
        label: "__other__",
        shortLabel: ShortCleanupOnLabels("__other__"),
        count: 0,
        responses: []
      };
      choicesTallyObject.push(otherReason);

      // Iterate over the respondents and tally up the results for this competitor
      for (let t = 0; t < competitorResps.length; t++) {
        let resp = competitorResps[t];

        // Find the answer to the reasons question
        let reasons = resp.answers.reasonsWhyWinnerChosen;
        if (reasons && reasons.responses && reasons.responses.length > 0) {
          for (let c = 0; c < reasons.responses.length; c++) {
            let reason = reasons.responses[c];
            if (reason == 9999) {
              otherReason.count++;
              // Merge the actual other reason
              if (reasons.other && reasons.other.trim().length > 0) {
                if (!otherReason.responses.find((rs) => {
                  return rs == reasons.other;
                })) {
                  otherReason
                    .responses
                    .push({ id: resp.id, p: resp.isProspect, txt: reasons.other.toString().trim(), sv: resp.survey.guid });
                }
              }
            } else {
              // Regular reason
              choicesTallyObject[reason].count++;
            }
          }
        }
      }

      // Sort the reasons by count
      choicesTallyObject = choicesTallyObject.sort((a, b) => {
        if (a.count < b.count) {
          return 1;
        } else if (a.count > b.count) {
          return -1;
        } else {
          return 0;
        }
      });

      // Assign it
      competitor.reasons = choicesTallyObject;
    }
  }

  // Assign it
  resultObject.losingDealsTo = competitorInfo;

  // Spit out the rerult
  return resultObject;
};

/**
 * Ensure the historical months values are computed
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const CompetitionEnsureHistoryComputed = async function (cfg, org) {
  const monthsToGoBack = 14;

  // Get the previous reports
  var orgReports = await OrgReportCache.GetReportsForOrgAndTypeAsync(cfg, org.id, OrgReportCache.REPORT_TYPE.MONTHLY_COMPETITION);

  // Compute the missing reports
  var monthList = [],
    currentMonth = moment().startOf('month').subtract(1, 'day');

  // Build an array of months prior to this one with start and end dates
  for (let i = 0; i < monthsToGoBack; i++) {
    var startDay = currentMonth
      .clone()
      .startOf("month");
    var endDay = currentMonth
      .clone()
      .endOf("month");
    var themonth = {
      monthStr: currentMonth.format("MMM"),
      month: currentMonth.month(),
      year: currentMonth.year(),
      startDay: startDay.toDate(),
      endDay: endDay.toDate(),
      report: orgReports.find((rep) => {
        return rep.created_for_year == currentMonth.year() && rep.created_for_month == currentMonth.month();
      })
    };
    monthList.push(themonth);

    if (!themonth.report) {
      // Make it!
      themonth.report = await GetCompetitionBreakdownForPeriod(cfg, org, moment(themonth.startDay), moment(themonth.endDay));
      // Save it in the DB
      await OrgReportCache.CreateAsync(cfg, {
        report: Buffer.from(JSON.stringify(themonth.report)),
        report_type: OrgReportCache.REPORT_TYPE.MONTHLY_COMPETITION,
        organization_id: org.id,
        created_for_year: themonth.year,
        created_for_month: themonth.month
      });
    } else {
      themonth.report = JSON.parse(themonth.report.report.toString());
    }

    currentMonth.subtract(1, "month");
  }

  // Spit it out
  return monthList;
};

/**
 * Get a competitor report for that time period
 * @param {*} cfg 
 * @param {*} orgid 
 * @param {*} startdate 
 * @param {*} enddate 
 * @param {*} dealclosetype 
 * @param {*} respondenttype 
 * @param {*} search 
 */
const CompetitorsOverviewAsync = async function (cfg, orgid, startdate, enddate) {
  // Get the Org NS
  const Organization = require('../../models/organization');

  // First get the org
  const org = await Organization.GetByIdAsync(cfg, orgid);

  if (!org) {
    throw new Error("Organization does not exist: " + orgid);
  }

  // Get the report breakdown
  const report = await GetCompetitionBreakdownForPeriod(cfg, org, moment(startdate), moment(enddate));

  // Get the previous reports
  var previous = await CompetitionEnsureHistoryComputed(cfg, org);

  // Get the current month but dont save or cache it
  const nowMmt = moment();
  previous.push({
    monthStr: nowMmt.format("MMM"),
    month: nowMmt.month(),
    year: nowMmt.year(),
    startDay: nowMmt.startOf('month').toDate(),
    endDay: nowMmt.endOf('month').toDate(),
    report: await GetCompetitionBreakdownForPeriod(cfg, org, nowMmt.startOf('month').clone(), nowMmt.endOf('month').clone())
  });

  // Sort it
  previous = previous.sort(function (a, b) {
    let ad = new Date(a.startDay);
    let bd = new Date(b.startDay);
    if (ad > bd) {
      return 1;
    } else if (ad < bd) {
      return -1;
    } else {
      return 0;
    }
  });

  // Remove any dates not in the range from previous
  let startDateBoundaryEx = moment(startdate).startOf('month').subtract(1, 'minute').toDate();
  let endDateBoundaryEx = moment(enddate).endOf('month').add(1, 'minute').toDate();
  for (let i = 0; i < previous.length; i++) {
    if (previous[i].endDay <= startDateBoundaryEx || previous[i].startDay >= endDateBoundaryEx) {
      previous.splice(i--, 1);
    }
  }

  // Find all the unique reasons
  var legend = [];
  var indexItems = function (itm) {
    if (!legend.find((l) => {
      return l.label == itm.label;
    })) {
      legend.push({ shortLabel: itm.shortLabel, label: itm.label });
    }
  };
  previous.forEach(p => {
    p.report.prospectCompetition.losingDealsTo.forEach(indexItems);
    p.report.internalCompetition.losingDealsTo.forEach(indexItems);
    p.report.aggregateCompetition.losingDealsTo.forEach(indexItems);
  });

  // Fix the legend to have OTHER at bottom
  let otherLabel = legend.find((l) => { return l.label == "__other__"; });
  legend.splice(legend.indexOf(otherLabel), 1);
  if (otherLabel != null) {
    legend.push(otherLabel);
  }

  // Spit out the final object
  return {
    startdate: startdate.getTime(),
    enddate: enddate.getTime(),
    legend: legend,
    organization_id: orgid,
    data: report,
    previous: previous
  };
};

// Expose it
module.exports = {
  CompetitorsOverviewAsync
};