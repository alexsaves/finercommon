const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const uuidV4 = require('uuid/v4');
const utils = require('../utils/utils');
const tablename = 'crm_integrations';

/**
* The crm roles class
*/
var CRMRoles = function (details) {
  extend(this, details || {});
};

/**
* Create an crm roles
*/
CRMRoles.Create = function (cfg, data, extraFields, cb) {
  cb = cb || function () {};
  const rowDict = [
    {
      name: "Id",
      row_name: "role_id"
    }, {
      name: "ParentsRoleId",
      row_name: "parents_role_id"
    }, {
      name: "Name",
      row_name: "name"
    }
  ];
  const query = utils.createInsertStatementGivenData(cfg.db.db, 'crm_roles', data, rowDict, extraFields);
  console.log(query);
  dbcmd.cmd(cfg.pool, query, [], function (result) {
    console.log(result);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = CRMRoles;