const dbcmd = require('../utils/dbcommand');
const extend = require('extend');
const tablename = 'organizations';
const CRMIntegrations = require('../models/crmintegrations');
const moment = require('moment');
const OrganizationAssociations = require('../models/organizationassociations');
const OrgReportCache = require('../models/orgreportcache');
const GeneralReport = require('../models/reports/general');
const Survey = require('../models/survey');

/**
* The organizations class
*/
var Organization = function (details) {
  extend(this, details || {});
  if (this.competitor_list instanceof Buffer) {
    this.competitor_list = JSON.parse(this.competitor_list.toString());
  }
  if (this.feature_list instanceof Buffer) {
    this.feature_list = JSON.parse(this.feature_list.toString());
  }
};

/**
 * Get the list of integrations for an organization
 */
Organization.prototype.getIntegrations = function (cfg, cb) {
  CRMIntegrations.GetForOrg(cfg, this.id, cb);
};

/**
 * Get the list of integrations for an organization
 */
Organization.prototype.getIntegrationsAsync = function (cfg) {
  return new Promise((resolve, reject) => {
    this.getIntegrations(cfg, (err, ints) => {
      if (err) {
        reject(err);
      } else {
        resolve(ints);
      }
    });
  });
};

/**
 * Get the surveys for this organization (ASYNC)
 */
Organization.prototype.getSurveysAsync = async function (cfg) {
  return await Survey.GetForOrganizationAsync(cfg, this.id);
};

/**
 * Get all the respondents for this organization (ASYNC)
 */
Organization.prototype.getRespondentsAsync = async function (cfg) {
  var svs = await Survey.GetForOrganizationAsync(cfg, this.id);
  var resps = [];
  for (let i = 0; i < svs.length; i++) {
    let svresps = await svs[i].getRespondentsAsync(cfg);
    resps = resps.concat(svresps);
  }
  return resps;
};

/**
 * Delete all
 */
Organization.DeleteAll = function (cfg, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id > 0', function () {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
 * Delete all (ASYNC)
 */
Organization.DeleteAllAsync = function (cfg) {
  return new Promise((resolve, reject) => {
    Organization.DeleteAll(cfg, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Figure out all the monthly reports prior to this month for all organizations
 * @param {*} cfg
 * @param {*} cb
 */
Organization.ComputeAllPreviousMonthlyReports = async function (cfg) {
  var orgs = await Organization.GetAllAsync(cfg);
  if (orgs && orgs.length > 0) {
    // Loop over the orgs and grab all their reports
    for (let i = 0; i < orgs.length; i++) {
      if (orgs[i].daysAlive() > 5) {
        orgs[i].reports = await orgs[i].ComputeAllPreviousMonthlyReportsAsync(cfg);
      }
    }
  }
  return orgs;
};

/**
 * Compute all the previous month reports for this organization
 * @param {*} cfg
 * @param {*} cb
 */
Organization.prototype.ComputeAllPreviousMonthlyReportsAsync = async function (cfg) {
  var monthList = [],
    currentMonth = moment();

  // Build an array of months prior to this one with start and end dates
  for (let i = 0; i < 14; i++) {
    currentMonth.subtract(1, "month");
    var startDay = currentMonth
      .clone()
      .startOf("month");
    var endDay = currentMonth
      .clone()
      .endOf("month");
    monthList.push({
      monthStr: currentMonth.format("MMM"),
      month: currentMonth.month(),
      year: currentMonth.year(),
      startDay: startDay.toDate(),
      endDay: endDay.toDate()
    });
  }

  var orgReports = await OrgReportCache.GetReportsForOrgAndTypeAsync(cfg, this.id, OrgReportCache.REPORT_TYPE.MONTHLY_SUMMARY);

  // Now iterate over each month and see if we have it
  for (let j = 0; j < monthList.length; j++) {
    let existingRep = orgReports.find((rep) => {
      return rep.created_for_year == monthList[j].year && rep.created_for_month == monthList[j].month;
    });
    if (!existingRep) {
      // We dont have it! Make one
      var rep = await GeneralReport.GeneralReportAsync(cfg, this.id, monthList[j].startDay, monthList[j].endDay, true);

      // Save it in the DB
      var finalRep = await OrgReportCache.CreateAsync(cfg, {
        report: Buffer.from(JSON.stringify(rep)),
        report_type: OrgReportCache.REPORT_TYPE.MONTHLY_SUMMARY,
        organization_id: this.id,
        created_for_year: monthList[j].year,
        created_for_month: monthList[j].month
      });
      orgReports.push(finalRep);
    }
  }

  // Grab it from the DB again
  orgReports = orgReports.sort((a, b) => {
    var ascore = (a.created_for_year * 12) + (a.created_for_month);
    var bscore = (b.created_for_year * 12) + (b.created_for_month);
    if (ascore < bscore) {
      return 1;
    } else if (ascore > bscore) {
      return -1;
    } else {
      return 0;
    }
  });

  return orgReports;
};

/**
 * Get the owner of the organization
 */
Organization.prototype.getOwnerAccount = function (cfg, cb) {
  OrganizationAssociations.GetAllForOrg(cfg, this.id, (err, assocs) => {
    if (err) {
      cb(err);
    } else {
      var ownerAssoc = assocs.find((sc) => {
        return sc.assoc_type == 0;
      });
      if (ownerAssoc !== null && typeof ownerAssoc != undefined) {
        Account = require('../models/account');
        Account.GetById(cfg, ownerAssoc.account_id, (err, act) => {
          if (err) {
            cb(err);
          } else {
            cb(null, act);
          }
        });
      } else {
        cb(new Error("Could not find owner"));
      }
    }
  });
};

/**
 * How long has this org been around?
 */
Organization.prototype.daysAlive = function () {
  var cat = moment(this.created_at);
  return moment().diff(cat, 'days');
};

/**
 * Get the things about the organization that this user is allowed to know
 * (users who have access, oustanding invitations, etc)
 */
Organization.prototype.getSharingSettingsForUser = function (cfg, userid, cb) {
  let models = require('../models/all');
  models
    .Account
    .GetById(cfg, userid, (err, usr) => {
      if (err) {
        cb(err);
      } else {
        usr.getAccessLevelForOrganization(cfg, this.id, (err, accs) => {
          if (err) {
            cb(err);
          } else {
            // Access 0 = owner, 1 = admin, 2 = user
            OrganizationAssociations.GetAllForOrg(cfg, this.id, (err, assocs) => {
              if (err) {
                cb(err);
              } else {
                assocs.forEach((asc) => {
                  asc.type = "ASSOCIATION";
                });
                models
                  .OrganizationInvitation
                  .GetAllByOrg(cfg, this.id, (err, ivts) => {
                    if (err) {
                      cb(err);
                    } else {
                      ivts.forEach((asc) => {
                        asc.type = "INVITE";
                      });
                      let finalList = assocs.concat(ivts);
                      cb(null, {
                        organization_id: this.id,
                        shares: finalList
                      });
                    }
                  });
              }
            });
          }
        });
      }
    });
};

/**
* Get the organizations for a particular account
*/
Organization.GetForAccount = function (cfg, id, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.org_account_associations WHERE account_id = ?', [id], function (assocresult) {
    if (assocresult.length == 0) {
      cb(null, []);
    } else {
      let idlist = [];
      for (let t = 0; t < assocresult.length; t++) {
        idlist.push(assocresult[t].organization_id);
      }
      dbcmd
        .cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id IN (' + idlist.join(', ') + ')', function (result) {
          let outOrgs = [];
          for (let h = 0; h < result.length; h++) {
            let org = new Organization(result[h]);
            let assoc = assocresult.find(function (val) {
              return val.organization_id == org.id;
            });
            org.association = assoc;
            outOrgs.push(org);
          }
          cb(null, outOrgs);
        }, function (err) {
          cb(err);
        });
    }
  }, function (err) {
    cb(err);
  });
};

/**
* Get all organizations
*/
Organization.GetAll = function (cfg, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.org_account_associations', function (assocresult) {
    if (assocresult.length == 0) {
      cb(null, []);
    } else {
      let idlist = [];
      for (let t = 0; t < assocresult.length; t++) {
        idlist.push(assocresult[t].organization_id);
      }
      dbcmd
        .cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id IN (' + idlist.join(', ') + ')', function (result) {
          let outOrgs = [];
          for (let h = 0; h < result.length; h++) {
            let org = new Organization(result[h]);
            let assoc = assocresult.find(function (val) {
              return val.organization_id == org.id;
            });
            org.association = assoc;
            outOrgs.push(org);
          }
          cb(null, outOrgs);
        }, function (err) {
          cb(err);
        });
    }
  }, function (err) {
    cb(err);
  });
};

/**
 * Get all organizations (ASYNC)
 * @param {*} cfg
 */
Organization.GetAllAsync = function (cfg) {
  return new Promise((resolve, reject) => {
    Organization.GetAll(cfg, (err, orgs) => {
      if (err) {
        reject(err);
      } else {
        resolve(orgs);
      }
    });
  });
};

/**
* Get an org by its id
*/
Organization.GetById = function (cfg, id, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(null, result.length > 0
        ? new Organization(result[0])
        : null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Get an org by its ID
 * @param {*} cfg
 * @param {*} id
 */
Organization.GetByIdAsync = function (cfg, id) {
  return new Promise((resolve, reject) => {
    Organization.GetById(cfg, id, (err, org) => {
      if (err) {
        reject(err);
      } else {
        resolve(org);
      }
    });
  });
};

/**
* Get an org by its name
*/
Organization.GetByName = function (cfg, name, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE name LIKE ? LIMIT 1', [name], function (result) {
    cb(null, result.length > 0
        ? new Organization(result[0])
        : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get an org by its name (ASYNC)
*/
Organization.GetByNameAsync = function (cfg, name) {
  return new Promise((resolve, reject) => {
    Organization.GetByName(cfg, name, (err, org) => {
      if (err) {
        reject(err);
      } else {
        resolve(org);
      }
    })
  });
};

/**
* Delete an org by its id
*/
Organization.DeleteById = function (cfg, id, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(null);
  }, function (err) {
    var EmailUnsubscriptions = require('./emailunsubscription');
    EmailUnsubscriptions.DeleteForOrgId(cfg, id, cb);
  });
};

/**
* Create a account
*/
Organization.Create = function (cfg, details, cb) {
  cb = cb || function () { };
  details = details || {};
  var _Defaults = {
    name: "",
    created_at: new Date(),
    updated_at: new Date(),
    feature_list: [
      "Flexibility & customization", "Quality & performance", "Security & trust concerns", "Integration with other vendors", "Reporting and analytics"
    ],
    competitor_list: [
      "Preloaded Competitor A", "Preloaded Competitor B"
    ],
    default_survey_template: 'bokehlight'
  };
  extend(_Defaults, details);
  _Defaults.feature_list = Buffer.from(JSON.stringify(_Defaults.feature_list));
  _Defaults.competitor_list = Buffer.from(JSON.stringify(_Defaults.competitor_list));
  var valKeys = Object.keys(_Defaults),
    query = 'INSERT INTO ' + cfg.db.db + '.' + tablename + ' SET ',
    params = [],
    count = 0;
  for (var elm in valKeys) {
    if (count > 0) {
      query += ', ';
    }
    query += valKeys[elm] + ' = ?';
    params.push(_Defaults[valKeys[elm]]);
    count++;
  }
  dbcmd
    .cmd(cfg.pool, query, params, function (result) {
      Organization
        .GetById(cfg, result.insertId, function (err, org) {
          if (err) {
            cb(err);
          } else {
            cb(null, org);
          }
        });
    }, function (err) {
      cb(err);
    });
};

/**
* Create a account (ASYNC)
*/
Organization.CreateAsync = function (cfg, details) {
  return new Promise((resolve, reject) => {
    Organization.Create(cfg, details, (err, org) => {
      if (err) {
        reject(err);
      } else {
        resolve(org);
      }
    });
  });
};

/**
 * Get all the users for this org
 * @param {Object} cfg The DB Configuration
 */
Organization.prototype.getAllUsersOfOrgAsync = async function (cfg) {
  let assocs = await OrganizationAssociations.GetAllForOrgAsync(cfg, this.id);
  return assocs;
};

/**
 * Save any changes to the DB row
 */
Organization.prototype.commit = function (cfg, cb) {
  cb = cb || function () { };
  var excludes = [
    'id', 'created_at'
  ],
    valKeys = Object.keys(this),
    query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET ',
    params = [],
    count = 0;
  this.updated_at = new Date();
  for (var elm in valKeys) {
    if (excludes.indexOf(valKeys[elm]) == -1) {
      if (count > 0) {
        query += ', ';
      }
      query += valKeys[elm] + ' = ?';
      if (this[valKeys[elm]] instanceof Array) {
        params.push(Buffer.from(JSON.stringify(this[valKeys[elm]])));
      } else {
        params.push(this[valKeys[elm]]);
      }
      count++;
    }
  }
  query += ' WHERE id = ?';
  params.push(this.id);

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    cb(null, this);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = Organization;