const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  tablename = 'organizations',
  CRMIntegrations = require('../models/crmintegrations'),
  moment = require('moment'),
  OrganizationAssociations = require('../models/organizationassociations'),
  OrgReportCache = require('../models/orgreportcache'),
  GeneralReport = require('../models/reports/general');

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
 * Delete all
 */
Organization.DeleteAll = function (cfg, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id > 0', function () {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
 * Figure out all the monthly reports prior to this month for all organizations
 * @param {*} cfg 
 * @param {*} cb 
 */
Organization.ComputeAllPreviousMonthlyReports = async function(cfg, cb) {
  var orgs = await Organization.GetAllAsync(cfg);
  if (orgs && orgs.length > 0) {
    var monthList = [];
    var currentMonth = moment();

    // Build an array of months prior to this one with start and end dates
    for (let i = 0; i < 12; i++) {
      currentMonth.subtract(1, "month");
      var startDay = currentMonth.clone().startOf("month");
      var endDay = currentMonth.clone().endOf("month");
      monthList.push({
        monthStr: currentMonth.format("MMM"),
        month: currentMonth.month(),
        year: currentMonth.year(),
        startDay: startDay.toDate(),
        endDay: endDay.toDate()
      });
    }

    // Loop over the orgs and grab all their reports
    for (let i = 0; i < orgs.length; i++) {
      let orgReports = await OrgReportCache.GetReportsForOrgAndTypeAsync(cfg, orgs[i].id, OrgReportCache.REPORT_TYPE.MONTHLY_SUMMARY);

      // Now iterate over each month and see if we have it
      for (let j = 0; j < monthList.length; j++) {        
        let existingRep = orgReports.find((rep) => {
          return rep.created_for_year == monthList[j].year && rep.created_for_month == monthList[j].month;
        });
        if (!existingRep) {
          // We dont have it! Make one
          var rep = await GeneralReport.GeneralReportAsync(cfg, orgs[i].id, monthList[j].startDay, monthList[j].endDay);
          
          // Save it in the DB
          var finalRep = await OrgReportCache.CreateAsync(cfg, {
            report: new Buffer(JSON.stringify(rep)),
            report_type: OrgReportCache.REPORT_TYPE.MONTHLY_SUMMARY,
            organization_id: orgs[i].id,
            created_for_year: monthList[j].year,
            created_for_month: monthList[j].month
          });
          orgReports.push(finalRep);
        }
      }
    }
  }
  return orgs;
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
  cb = cb || function () {};
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
  cb = cb || function () {};
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
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No user found."
      }
      : null, result.length > 0
      ? new Organization(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Delete an org by its id
*/
Organization.DeleteById = function (cfg, id, cb) {
  cb = cb || function () {};
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
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    name: "",
    created_at: new Date(),
    updated_at: new Date(),
    feature_list: [
      "Flexibility & customization", "Quality & performance", "Security & trust concerns", "Integration with other vendors", "Reporting and analytics"
    ],
    competitor_list: [
      "Preloaded Competitor A",
      "Preloaded Competitor B"
    ],
    default_survey_template: 'bokehlight'
  };
  extend(_Defaults, details);
  _Defaults.feature_list = new Buffer(JSON.stringify(_Defaults.feature_list));
  _Defaults.competitor_list = new Buffer(JSON.stringify(_Defaults.competitor_list));
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
 * Save any changes to the DB row
 */
Organization.prototype.commit = function (cfg, cb) {
  cb = cb || function () {};
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
      if (this[valKeys[elm]]instanceof Array) {
        params.push(new Buffer(JSON.stringify(this[valKeys[elm]])));
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