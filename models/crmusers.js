const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  utils = require('../utils/utils'),
  tablename = 'crm_integrations';

/**
* The crm accounts class
*/
var CRMUsers = function (details) {
  extend(this, details || {});
};

/**
* Create an integration
*/
CRMUsers.Create = function (cfg, data, extraFields, cb) {
  cb = cb || function () {};
  const rowDict = [{
    name: "FirstName",
    row_name: "FirstName"
  },
  {
    name: "LastName",
    row_name: "LastName"
  },
  {
    name: "Name",
    row_name: "name"
  },
  {
    name: "Id",
    row_name: "Id"
  },
  {
    name: "Username",
    row_name: "Username"
  },
  {
    name: "Email",
    row_name: "Email"
  }];
  const { query, params } = utils.createInsertOrUpdateStatementGivenData(cfg.db.db, 'crm_users', data, rowDict, extraFields);
  dbcmd
    .cmd(cfg.pool, query, params, function (result) {
    }, function (err) {
      cb(err);
    });
};

// Expose it
module.exports = CRMUsers;