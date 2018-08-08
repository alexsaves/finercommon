const survey = require('../survey');
const SurveyValueExtractor = require('../surveyvalueextractor');
const Respondent = require('../respondent');
const OrganizationAssociations = require('../organizationassociations');
const BuyX = require('../buyx');
const Approval = require('../approval');
const Organization = require('../organization');
const Survey = require('../survey');
const CRMOpportunities = require('../crmopportunities');
const CRMUsers = require('../crmusers');
const CRMContacts = require('../crmcontacts');
const moment = require('moment');
const TimeAgo = require('javascript-time-ago');
const TimeAgoEn = require('javascript-time-ago/locale/en');
TimeAgo.locale(TimeAgoEn);
// Create relative date/time formatter.
const timeAgo = new TimeAgo('en-US');

/**
 * Get the open ends report
 * Deal close type:
 * 0 = all
 * 1 = Lost
 * 2 = Won
 * Respondent types:
 * 0 = all
 * 1 = prospect
 * 2 = sales team
 */
const OpenEndsReportAsync = async function (cfg, orgid, startdate, enddate, dealclosetype, respondenttype, search) {
    // First get the org
    const org = await Organization.GetByIdAsync(cfg, orgid);

    // First get all the surveys for this org from this time period
    let surveys = await Survey.GetForOrganizationAsync(cfg, org.id);

    // Filter the surveys
    if (respondenttype > 0) {
        // its not ALL surveys
        surveys = surveys.filter((sv) => {
            if (respondenttype === 1) {
                return sv.survey_type === 0;
            } else if (respondenttype === 2) {
                return sv.survey_type === 1;
            }
        });
    }

    // Get the list of unique opportunities
    const uniqueOpps = {};
    surveys.forEach((sv) => {
        uniqueOpps[sv.opportunity_id] = true;
    });

    // Get the opportunities
    let opps = await CRMOpportunities.GetByIdsAsync(cfg, Object.keys(uniqueOpps));

    // Filter them
    if (dealclosetype > 0) {
        opps = opps.filter((opp) => {
            if (dealclosetype === 1) {
                return opp.IsWon === null || opp.IsWon == "false" || opp.IsWon == "null";
            } else if (dealclosetype === 2) {
                return opp.IsWon === "true";
            }
        });
    }

    // Now reverse-filter the surveys list based on what is remaining inside the opps list
    surveys = surveys.filter((sv) => {
        return opps.find((op) => {
            return op.id === sv.opportunity_id;
        });
    });

    // We have a filtered list of surveys to look for respondents
    let resps = await Respondent.GetBySurveysAndTimeRangeAsync(cfg, surveys.map((sv) => { return sv.guid; }), startdate, enddate);

    // Tell us which are customers and which are prospects
    resps.forEach(r => {
        let sv = surveys.find(s => s.guid == r.survey_guid);
        if (sv.survey_type == 0) {
            r.isProspect = true;
        } else {
            r.isProspect = false;
        }
        r.buyX = BuyX.CalculateBuyXFromResponses(sv, r.answers);
    });

    // Convert to respondents
    var finalRespList = resps.map((r) => {
        return ConvertRespondentToOpenEndObject(r);
    }).filter((r) => {
        return r.oe.length > 0;
    }).sort((a, b) => {
        if (a.when == b.when) {
            return 0;
        } else if (a.when < b.when) {
            return 1;
        } else if (a.when > b.when) {
            return -1;
        }
    });

    // Populate the non-anonmyous ones with info
    const approvalSet = await Approval.GetListAsync(cfg, finalRespList.filter(r => r.anon == false && r.approval_guid).map(r => r.approval_guid));
    
    // Holds the list of unique contacts and users
    let contactlist = {};
    let userlist = {};

    // Assign the approvals to the right respondents
    finalRespList.forEach(r => {
        if (r.anon == false && r.approval_guid) {
            r.approval = approvalSet.find(a => a.guid == r.approval_guid);
            if (r.approval) {
                if (r.approval.crm_contact_id) {
                    contactlist[r.approval.crm_contact_id] = true;
                } else {
                    userlist[r.approval.crm_user_id] = true;
                }
            }
        }
    });

    // Find all those users and contacts
    const finalContactList = await CRMContacts.GetByIdsAsync(cfg, Object.keys(contactlist));
    const finalUsersList = await CRMUsers.GetByIdsAsync(cfg, Object.keys(userlist));

    // Assign the contacts and users to the right respondents
    finalRespList.forEach(r => {
        if (r.anon == false && r.approval_guid) {            
            if (r.approval) {
                if (r.approval.crm_contact_id) {
                    let contactObj = finalContactList.find(c => c.Id == r.approval.crm_contact_id);
                    if (contactObj) {
                        r.isContact = true;
                        r.info = contactObj;
                    }
                } else {
                    let contactObj = finalUsersList.find(c => c.Id == r.approval.crm_user_id);
                    if (contactObj) {
                        r.isContact = false;
                        r.info = contactObj;
                    }
                }
                if (r.info) {
                    delete r.info.Metadata;
                }
                delete r.approval;
            }
        }
    });

    // Apply search
    if (typeof search != "undefined" && search.length > 0) {
        search = search.trim().toLowerCase();
        finalRespList = finalRespList.filter((r) => {
            for (let i = 0; i < r.oe.length; i++) {
                if (r.oe[i].val.toLowerCase().indexOf(search) > -1) {
                    return true;
                }
            }
            return false;
        });
    }

    // Spit it out
    return finalRespList;
};

/**
 * Convert any respondent object to an open end object
 * @param {Object} rsp 
 */
const ConvertRespondentToOpenEndObject = function (rsp) {
    var outObj = {
        id: rsp.id,
        survey_guid: rsp.survey_guid,
        when: rsp.created_at,
        whents: rsp.created_at.getTime(),
        whenstr: moment(rsp.created_at).format("dd, MMM Do YYYY"),
        agostr: timeAgo.format(rsp.created_at),
        buyX: rsp.buyX,
        oe: [],
        anon: true,
        isProspect: rsp.isProspect
    };

    let ans = rsp.answers;
    if (ans) {
        if (ans.anonymity) {
            outObj.anon = ans.anonymity.response == 1;
        }
        outObj.approval_guid = rsp.approval_guid;
        if (typeof ans.onePieceAdvice != "undefined" && ans.onePieceAdvice.trim().length > 0) {
            outObj.oe.push({ key: "Advice", val: ans.onePieceAdvice });
        }

        if (typeof ans.serviceReasons != "undefined" && ans.serviceReasons.trim().length > 0) {
            outObj.oe.push({ key: "Service", val: ans.serviceReasons });
        }

        if (typeof ans.valueReasons != "undefined" && ans.valueReasons.trim().length > 0) {
            outObj.oe.push({ key: "Value", val: ans.valueReasons });
        }
    }
    return outObj;
};

// Expose it
module.exports = {
    OpenEndsReportAsync
};