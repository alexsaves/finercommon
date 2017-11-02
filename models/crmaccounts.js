const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  utils = require('../utils/utils'),
  tablename = 'crm_integrations';

/**
* The crm accounts class
*/
var CRMAccounts = function (details) {
  extend(this, details || {});
};

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
      console.log(result);
    }, function (err) {
      cb(err);
    });
};

// Expose it
module.exports = CRMAccounts;