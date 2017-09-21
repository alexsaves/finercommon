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
    row_name: "account_number"
  },
  {
    name: "OwnerId",
    row_name: "owner_id"
  },
  {
    name: "Name",
    row_name: "name"
  },
  {
    name: "Type",
    row_name: "type"
  },
  {
    name: "Industry",
    row_name: "industry"
  },
  {
    name: "BillingCountry",
    row_name: "billing_country"
  },
  {
    name: "BillingCity",
    row_name: "billing_city"
  },
  {
    name: "Phone",
    row_name: "phone"
  }];
  const query = utils.createInsertStatementGivenData(cfg.db.db, 'crm_accounts', data, rowDict, extraFields);
  console.log(query);
  dbcmd
    .cmd(cfg.pool, query, [], function (result) {
      console.log(result);
    }, function (err) {
      cb(err);
    });
};

// Expose it
module.exports = CRMAccounts;