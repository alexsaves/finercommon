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
    row_name: "first_name"
  },
  {
    name: "LastName",
    row_name: "last_name"
  },
  {
    name: "Name",
    row_name: "name"
  },
  {
    name: "Username",
    row_name: "username"
  },
  {
    name: "UserType",
    row_name: "user_type"
  },
  {
    name: "CompanyName",
    row_name: "company_name"
  },
  {
    name: "CommunityNickname",
    row_name: "community_nickname"
  },
  {
    name: "RoleId",
    row_name: "role_id"
  }];
  const query = utils.createInsertStatementGivenData(cfg.db.db, 'crm_users', data, rowDict, extraFields);
  console.log(query);
  dbcmd
    .cmd(cfg.pool, query, [], function (result) {
      console.log(result);
    }, function (err) {
      cb(err);
    });
};

// Expose it
module.exports = CRMUsers;