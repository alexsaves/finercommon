const moment = require('moment');
const TimeAgo = require('javascript-time-ago');
const TimeAgoEn = require('javascript-time-ago/locale/en');
const survey = require('../survey');
const respondent = require('../respondent');
const SurveyValueExtractor = require('../surveyvalueextractor');
const OrgReportCache = require('../orgreportcache');
const CodifyReasonForLoss = require('./general').CodifyReasonForLoss;

TimeAgo.locale(TimeAgoEn);
// Create relative date/time formatter.
const timeAgo = new TimeAgo('en-US');

/**
 * Get the breakdown of primary reasons for the time period
 * @param {*} cfg 
 * @param {Organization} org 
 * @param {Date} mStartdate Exclusive start date (MOMENT)
 * @param {Date} mEnddate Inclusive end date (MOMENT)
 */
const GetPrimaryReasonsBreakdownForPeriod = async function (cfg, org, mStartdate, mEnddate) {
  // This will hold the final result
  var resultObject = {
    startDate: mStartdate.unix(),
    endDate: mEnddate.unix(),
    org: org.id
  };

  let ShortCleanupOnLabels = require('./general').ShortCleanupOnLabels;
  const CRMOpportunities = require('../crmopportunities');

  // Set up a survey value extractor
  let exter = new SurveyValueExtractor();

  // First get all the customer surveys
  let svs = await survey.GetForOrganizationAndTypeAsync(cfg, org.id, survey.SURVEY_TYPES.PROSPECT);
  let esvs = await survey.GetForOrganizationAndTypeAsync(cfg, org.id, survey.SURVEY_TYPES.EMPLOYEE);
  let allSvs = svs.concat(esvs);

  let prospectResps = await respondent.GetBySurveysAndTimeRangeAsync(cfg, svs.map(sv => sv.guid), mStartdate.toDate(), mEnddate.toDate());
  let employeeResps = await respondent.GetBySurveysAndTimeRangeAsync(cfg, esvs.map(sv => sv.guid), mStartdate.toDate(), mEnddate.toDate());

  prospectResps.forEach(r => {
    r.isProspect = true;
  });

  employeeResps.forEach(r => {
    r.isProspect = false;
  });

  let respondentArr = prospectResps.concat(employeeResps);
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

  resultObject.prospectReasons = [];
  resultObject.internalReasons = [];
  resultObject.count = respondentArr.length;

  // Tally them up
  for (let i = 0; i < respondentArr.length; i++) {
    let resp = respondentArr[i],
      answers = resp.answers,
      surveymodel = resp.survey.survey_model;

    let reasonsForLoss = resultObject.prospectReasons;
    if (!resp.isProspect) {
      reasonsForLoss = resultObject.internalReasons;
    }

    // Get the question definition from this survey for the key question
    let questionDef = exter._locateQuestionObjectForName("whyNotSelected", surveymodel.pages);

    // Proceed if we have everything
    if (questionDef && answers.whyNotSelected && answers.whyNotSelected.responses && answers.whyNotSelected.responses.length > 0) {
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
              dollars: 0,
              responses: [],
              ops: []
            };
            reasonsForLoss.push(otherval);
          }
          otherval.count++;
          let otheroo = answers.whyNotSelected.other;
          if (typeof (otheroo) != "undefined" && otheroo.trim().length > 0) {
            if (!otherval.responses.find((vl) => {
              return vl == otheroo;
            })) {
              if (otherval.ops.indexOf(resp.survey.opportunity_id) == -1) {
                otherval.ops.push(resp.survey.opportunity_id);
              }
              otherval
                .responses
                .push({ id: resp.id, p: resp.isProspect, txt: otheroo.trim(), sv: resp.survey.guid });
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
                count: 1,
                dollars: 0,
                ops: []
              };
              reasonsForLoss.push(existingEntry);
            }
            if (existingEntry.ops.indexOf(resp.survey.opportunity_id) == -1) {
              existingEntry.ops.push(resp.survey.opportunity_id);
            }
            existingEntry.count++;
          } else {
            // Option no longer exists??
            console.log("Option doesnt exist! hm..");
          }
        }
      }
    }
  }

  // Reusable sorter
  let reasonSortFn = function (a, b) {
    if (a.count > b.count) {
      return 1;
    } else if (a.count < b.count) {
      return -1;
    } else {
      return 0;
    }
  };

  // Merge them into a separate aggregated list
  resultObject.aggregated = JSON.parse(JSON.stringify(resultObject.prospectReasons));
  resultObject.aggregated.forEach(r => {
    let internalVer = resultObject.internalReasons.find((ir) => {
      return ir.label == r.label;
    });
    if (internalVer) {
      r.count += internalVer.count;
      if (r.label == "__other__") {
        r.responses = r.responses || [];
        r.responses = r.responses.concat(internalVer.responses || []);
      }
    }
  });

  // Sort them
  resultObject.prospectReasons = resultObject.prospectReasons.sort(reasonSortFn);
  resultObject.internalReasons = resultObject.internalReasons.sort(reasonSortFn);
  resultObject.aggregated = resultObject.aggregated.sort(reasonSortFn);

  // Compute the proportions
  var addProportionsToList = function (l) {
    var total = l.reduce((accum, val) => {
      return accum + val.count;
    }, 0);
    if (total == 0) {
      total = 1;
    }
    l.forEach((itm) => {
      itm.p = itm.count / total;
    });
  };
  addProportionsToList(resultObject.prospectReasons);
  addProportionsToList(resultObject.internalReasons);
  addProportionsToList(resultObject.aggregated);

  // Compute the dollar amounts for each reason
  var computeAmountsForReasons = async function (l) {
    for (let i = 0; i < l.length; i++) {
      l[i].dollars = await CRMOpportunities.GetDollarValueForOpIdsAsync(cfg, l[i].ops);
    }
  };
  await computeAmountsForReasons(resultObject.prospectReasons);
  await computeAmountsForReasons(resultObject.internalReasons);
  await computeAmountsForReasons(resultObject.aggregated);

  // Compute the codes for each reason
  var codifyReasons = async function (l) {
    for (let i = 0; i < l.length; i++) {
      l[i].code = CodifyReasonForLoss(l[i].label);
    }
  };
  codifyReasons(resultObject.prospectReasons);
  codifyReasons(resultObject.internalReasons);
  codifyReasons(resultObject.aggregated);

  // Spit out final object
  return resultObject;
};

/**
 * Ensure the historical months values are computed
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const PrimaryReasonsEnsureHistoryComputed = async function (cfg, org) {
  const monthsToGoBack = 14;

  // Get the previous reports
  var orgReports = await OrgReportCache.GetReportsForOrgAndTypeAsync(cfg, org.id, OrgReportCache.REPORT_TYPE.MONTHLY_PRIMARYREASONS);

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
      themonth.report = await GetPrimaryReasonsBreakdownForPeriod(cfg, org, moment(themonth.startDay), moment(themonth.endDay));
      // Save it in the DB
      await OrgReportCache.CreateAsync(cfg, {
        report: Buffer.from(JSON.stringify(themonth.report)),
        report_type: OrgReportCache.REPORT_TYPE.MONTHLY_PRIMARYREASONS,
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
 * Get the primary reasons for loss report
 */
const PrimaryReasonsOverviewAsync = async function (cfg, orgid, startdate, enddate, dealclosetype, respondenttype, search) {
  // Get the Org NS
  const Organization = require('../../models/organization');

  // First get the org
  const org = await Organization.GetByIdAsync(cfg, orgid);

  if (!org) {
    throw new Error("Organization does not exist: " + orgid);
  }

  // Get the report breakdown
  const report = await GetPrimaryReasonsBreakdownForPeriod(cfg, org, moment(startdate), moment(enddate));

  // Get the previous reports
  var previous = await PrimaryReasonsEnsureHistoryComputed(cfg, org);

  // Get the current month but dont save or cache it
  const nowMmt = moment();
  previous.push({
    monthStr: nowMmt.format("MMM"),
    month: nowMmt.month(),
    year: nowMmt.year(),
    startDay: nowMmt.startOf('month').toDate(),
    endDay: nowMmt.endOf('month').toDate(),
    report: await GetPrimaryReasonsBreakdownForPeriod(cfg, org, nowMmt.startOf('month').clone(), nowMmt.endOf('month').clone())
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
      legend.push({ shortLabel: itm.shortLabel, label: itm.label, code: CodifyReasonForLoss(itm.label) });
    }
  };
  previous.forEach(p => {
    p.report.prospectReasons.forEach(indexItems);
    p.report.internalReasons.forEach(indexItems);
    p.report.aggregated.forEach(indexItems);
  });

  // Fix the legend to have OTHER at bottom
  let otherLabel = legend.find((l) => { return l.label == "__other__"; });
  legend.splice(legend.indexOf(otherLabel), 1);
  if (otherLabel != null) {
    legend.push(otherLabel);
  }

  // Kill the first previous if its empty
  if (previous[0].report.aggregated.length == 0) {
    previous.splice(0, 1);
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
  PrimaryReasonsOverviewAsync
};