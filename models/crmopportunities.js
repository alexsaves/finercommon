const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  utils = require('../utils/utils'),
  tablename = 'crm_opportunities';

/**
* The crm opportunity class
*/
var CRMOpportunities = function (details) {
  extend(this, details || {});
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
    }
  ];
  const {query, params} = utils.createInsertOrUpdateStatementGivenData(cfg.db.db, 'crm_opportunities', data, rowDict, extraFields, 'Id');

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    console.log(result);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = CRMOpportunities;