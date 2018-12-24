const moment = require('moment');
const TimeAgo = require('javascript-time-ago');
const TimeAgoEn = require('javascript-time-ago/locale/en');
TimeAgo.locale(TimeAgoEn);
// Create relative date/time formatter.
const timeAgo = new TimeAgo('en-US');

/**
 * Get the primary reasons for loss report
 */
const PrimaryReasonsOverviewAsync = async function (cfg, orgid, startdate, enddate, dealclosetype, respondenttype, search) {
    return {
        isPrimary: true
    };
};

// Expose it
module.exports = {
    PrimaryReasonsOverviewAsync
};