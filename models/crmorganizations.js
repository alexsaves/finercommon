const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const uuidV4 = require('uuid/v4');
const utils = require('../utils/utils');
const tablename = 'crm_organizations';

/**
* The crm organizations class
*/
var CRMOrganizations = function (details) {
  extend(this, details || {});
};

/**
* Create an crm organization
*/
CRMOrganizations.Create = function (cfg, data, extraFields, cb) {
  cb = cb || function () {};
  const rowDict = [
    {
      name: "Id",
      row_name: "org_id"
    }, {
      name: "InstanceName",
      row_name: "instance_name"
    }, {
      name: "Name",
      row_name: "name"
    }, {
      name: "OrganizationType",
      row_name: "organization_type"
    }, {
      name: "PrimaryContact",
      row_name: "primary_contact"
    }, {
      name: "Country",
      row_name: "country"
    }, {
      name: "City",
      row_name: "city"
    }
  ];
  const query = utils.createInsertStatementGivenData(cfg.db.db, 'crm_organizations', data, rowDict, extraFields);
  console.log(query);
  dbcmd.cmd(cfg.pool, query, [], function (result) {
    console.log(result);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = CRMOrganizations;