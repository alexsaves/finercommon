const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  utils = require('../utils/utils'),
  CRMIntegrationRules = require('../models/crmintegrationrules'),
  CRMIntegrations = require('../models/crmintegrations'),
  CRMAccounts = require('../models/crmaccounts'),
  tablename = 'crm_opportunities';

/**
* The crm opportunity class
*/
var CRMOpportunities = function (details) {
  extend(this, details || {});
};

/**
 * Confirm that a user has the rights to send to a particular opportunity
 * @param {*} cfg
 */
CRMOpportunities.prototype.doesAUserHaveRightstoApproveAsync = function (cfg) {
  return new Promise((resolve, reject) => {});
};

/**
 * Set the approval status
 * @param {*} cfg
 * @param {Number} status The Status. 0 = nothing has happened
                                      1 = some approval happened
                                      2 = cancelled
 * @param {*} cb
 */
CRMOpportunities.prototype.setApprovalStatus = function (cfg, status, cb) {
  status = parseInt(status);
  cb = cb || function () {};
  if (isNaN(status)) {
    cb(new Error("Invalid status"));
    return;
  }
  let query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET approval_status = ? WHERE id = ?';
  dbcmd.cmd(cfg.pool, query, [
    status, this.id
  ], () => {
    cb(null, this);
  }, function (err) {
    cb(err);
  });
};

/**
 * Can a user approve this opportunity?
 * @param {*} cfg
 * @param {*} userid
 * @param {*} cb
 */
CRMOpportunities.prototype.canUserApprove = function (cfg, userid, cb) {
  CRMIntegrationRules.GetForIntegration(cfg, this.integration_id, (err, rules) => {
    if (err) {
      cb(err);
    } else {
      if (!rules || rules.length == 0) {
        cb(new Error("Missing Rules for Opportunity"));
      } else {
        CRMIntegrationRules.CanUserApproveWithTheseRules(cfg, rules, userid).then((canthey) => {
          cb(canthey);
        }).catch((err) => {
          cb(err);
        });
      }
    }
  })
};

/**
 * Set the approval status
 * @param {*} cfg
 * @param {Number} status The Status. 0 = nothing has happened
                                      1 = some approval happened
                                      2 = cancelled
 * @param {*} cb
 */
CRMOpportunities.prototype.setApprovalStatusAsync = function (cfg, status) {
  return new Promise((resolve, reject) => {
    this.setApprovalStatus(cfg, status, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

/**
 * Set the approval status
 * @param {*} cfg
 * @param {Number} status The Status. 0 = nothing has happened
                                      1 = some approval happened
                                      2 = cancelled
 * @param {*} cb
 */
CRMOpportunities.setApprovalStatus = function (cfg, id, status, cb) {
  status = parseInt(status);
  if (isNaN(status)) {
    cb(new Error("Invalid status"));
    return;
  }
  let query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET approval_status = ? WHERE id = ?';
  dbcmd.cmd(cfg.pool, query, [
    status, id
  ], () => {
    cb(null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Get opportunities by an array of ids
 */
CRMOpportunities.GetByIds = function (cfg, oids, cb) {
  cb = cb || function () {};
  if (oids && oids.length > 0) {
    var finalStr = "(";
    for (var k = 0; k < oids.length; k++) {
      if (k > 0) {
        finalStr += ", ";
      }
      finalStr += "'" + oids[k] + "'";
    }
    finalStr += ")";
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id IN ' + finalStr, function (result) {
      var res = [];
      for (var i = 0; i < result.length; i++) {
        res.push(new CRMOpportunities(result[i]));
      }
      cb(null, res);
    }, function (err) {
      cb(err);
    });
  } else {
    cb(null, []);
  }
};

/**
 * Get opportunities by an array of ids
 */
CRMOpportunities.GetByAccountIds = function (cfg, aids, cb) {
  cb = cb || function () {};
  if (aids && aids.length > 0) {
    var finalStr = "(";
    for (var k = 0; k < aids.length; k++) {
      if (k > 0) {
        finalStr += ", ";
      }
      finalStr += "'" + aids[k] + "'";
    }
    finalStr += ")";
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE AccountId IN ' + finalStr, function (result) {
      var res = [];
      for (var i = 0; i < result.length; i++) {
        res.push(new CRMOpportunities(result[i]));
      }
      cb(null, res);
    }, function (err) {
      cb(err);
    });
  } else {
    cb(null, []);
  }
};

/**
 * Get opportunities by an array of ids
 */
CRMOpportunities.GetByAccountIdsWithDates = function (cfg, aids, startDate, endDate, cb) {
  cb = cb || function () {};
  if (aids && aids.length > 0) {
    var finalStr = "(";
    for (var k = 0; k < aids.length; k++) {
      if (k > 0) {
        finalStr += ", ";
      }
      finalStr += "'" + aids[k] + "'";
    }
    finalStr += ")";
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE CloseDate >= ? AND CloseDate <= ? AND AccountId IN ' + finalStr, [
      startDate, endDate
    ], function (result) {
      var res = [];
      for (var i = 0; i < result.length; i++) {
        res.push(new CRMOpportunities(result[i]));
      }
      cb(null, res);
    }, function (err) {
      cb(err);
    });
  } else {
    cb(null, []);
  }
};

/**
* Get an opportunity by its id
*/
CRMOpportunities.GetById = function (cfg, guid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [guid], function (result) {
    cb(result.length === 0
      ? {
        message: "No opportunity found."
      }
      : null, result.length > 0
      ? new CRMOpportunities(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get an opportunity by its id
*/
CRMOpportunities.GetByIdAsync = function (cfg, guid) {
  return new Promise((resolve, reject) => {
    CRMOpportunities.GetById(cfg, guid, (err, opp) => {
      if (err) {
        reject(err);
      } else {
        resolve(opp);
      }
    });
  });
};

/**
 * Get the accounts for all these opportunities
 */
CRMOpportunities.PopulateAccounts = function (cfg, oppslist, cb) {
  cb = cb || function () {};
  if (oppslist && oppslist.length > 0) {
    let accountids = [];
    for (var k = 0; k < oppslist.length; k += 1) {
      if (accountids.indexOf(oppslist[k].AccountId) == -1) {
        accountids.push(oppslist[k].AccountId);
      }
    }
    const CRMAccounts = require('../models/crmaccounts');
    CRMAccounts.GetByIds(cfg, accountids, (err, acts) => {
      if (err) {
        cb(err);
      } else {
        for (let fd = 0; fd < acts.length; fd += 1) {
          delete acts[fd].Metadata;
        }
        for (let f = 0; f < oppslist.length; f += 1) {
          const actObj = acts.find((val) => {
            return val.Id === oppslist[f].AccountId;
          });
          if (actObj) {
            oppslist[f].account = actObj;
          }
        }
        cb(null, oppslist);
      }
    });
  } else {
    cb(null, []);
  }
};

/**
 * Get the owners for all these opportunities
 */
CRMOpportunities.PopulateOwners = function (cfg, oppslist, cb) {
  cb = cb || function () {};
  if (oppslist && oppslist.length > 0) {
    let accountids = [];
    for (var k = 0; k < oppslist.length; k += 1) {
      if (accountids.indexOf(oppslist[k].OwnerId) == -1) {
        accountids.push(oppslist[k].OwnerId);
      }
    }
    const CRMUsers = require('../models/crmusers');
    CRMUsers.GetByIds(cfg, accountids, (err, acts) => {
      if (err) {
        cb(err);
      } else {
        for (let fd = 0; fd < acts.length; fd += 1) {
          delete acts[fd].Metadata;
        }
        for (let f = 0; f < oppslist.length; f += 1) {
          const actObj = acts.find((val) => {
            return val.Id === oppslist[f].OwnerId;
          });
          if (actObj) {
            oppslist[f].owner = actObj;
          }
        }
        cb(null, oppslist);
      }
    });
  } else {
    cb(null, []);
  }
};

/**
 * Mark CRM Opportunities as cancelled
 */
CRMOpportunities.setApprovalStatusOnIdsAsync = function (cfg, ids) {
  return new Promise((resolve, reject) => {
    let fdfs = "(";
    for (let g = 0; g < ids.length; g++) {
      if (g > 0) {
        fdfs += ",";
      }
      fdfs += "'" + ids[g] + "'";
    }
    fdfs += ")";
    let query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET approval_status = ? WHERE id IN ' + fdfs;
    dbcmd.cmd(cfg.pool, query, [2], () => {
      resolve(ids);
    }, function (err) {
      reject(err);
    });
  });
};

/**
* Create an opportunity
*/
CRMOpportunities.Create = function (cfg, data, extraFields, cb) {
  cb = cb || function () {};
  const rowDict = [
    {
      name: "Id",
      row_name: "Id"
    }, {
      name: "AccountId",
      row_name: "AccountId"
    }, {
      name: "Amount",
      row_name: "Amount"
    }, {
      name: "IsClosed",
      row_name: "IsClosed"
    }, {
      name: "IsWon",
      row_name: "IsWon"
    }, {
      name: "OwnerId",
      row_name: "OwnerId"
    }, {
      name: "StageName",
      row_name: "StageName"
    }, {
      name: "CloseDate",
      row_name: "CloseDate"
    }, {
      name: "Name",
      row_name: "Name"
    }
  ];
  const {query, params} = utils.createInsertOrUpdateStatementGivenData(cfg.db.db, 'crm_opportunities', data, rowDict, extraFields, 'Id');

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    //console.log(result);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = CRMOpportunities;