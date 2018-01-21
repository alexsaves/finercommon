const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  utils = require('../utils/utils'),
  tablename = 'crm_accounts';

/**
* The crm accounts class
*/
var CRMAccounts = function (details) {
  extend(this, details || {});
};


/**
 * Get accounts by an array of ids
 */
CRMAccounts.GetByIds = function (cfg, oids, cb) {
  cb = cb || function () {};
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
          res.push(new CRMAccounts(result[i]));
      }
      cb(null, res);
  }, function (err) {
      cb(err);
  });
};

CRMAccounts.GetAllGivenIntegrationId = function(cfg, integrationId, cb) {
  cb = cb || function () {};
  if (integrationId) {
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE integration_id = ? ', [integrationId], function (result) {
      var res = [];
      for (var i = 0; i < result.length; i++) {
        res.push(new CRMAccounts(result[i]));
      }
      cb(null, res);
    }, function (err) {
      cb(err);
    });
  } else {
    cb(null, []);
  }
}

CRMAccounts.GetAccountsByOwnerIds = function (cfg, oids, cb) {
  cb = cb || function () {};
  var finalStr = "(";
  for (var k = 0; k < oids.length; k++) {
      if (k > 0) {
          finalStr += ", ";
      }
      finalStr += "'" + oids[k] + "'";
  }
  finalStr += ")";
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE OwnerId IN ' + finalStr, function (result) {
      var res = [];
      for (var i = 0; i < result.length; i++) {
          res.push(new CRMAccounts(result[i]));
      }
      cb(null, res);
  }, function (err) {
      cb(err);
  });
}

/**
* Create an integration
*/
CRMAccounts.Create = function (cfg, data, extraFields, cb) {
  cb = cb || function () {};
  const rowDict = [{
    name: "AccountNumber",
    row_name: "AccountNumber"
  },
  {
    name: "OwnerId",
    row_name: "OwnerId"
  },
  {
    name: "Name",
    row_name: "Name"
  },
  {
    name: "Id",
    row_name: "Id"
  }];
  const { query, params } = utils.createInsertOrUpdateStatementGivenData(cfg.db.db, 'crm_accounts', data, rowDict, extraFields, 'Id');

  dbcmd
    .cmd(cfg.pool, query, params, function (result) {
      //console.log(result);
    }, function (err) {
      cb(err);
    });
};

// Expose it
module.exports = CRMAccounts;