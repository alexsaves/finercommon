const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  utils = require('../utils/utils'),
  tablename = 'crm_contacts';

/**
* The crm accounts class
*/
var CRMContacts = function (details) {
  extend(this, details || {});
};

/**
* Get an Contact by its id
*/
CRMContacts.GetById = function (cfg, guid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [guid], function (result) {
    cb(result.length === 0
      ? {
        message: "No approval found."
      }
      : null, result.length > 0
      ? new CRMContacts(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get all Contact by their opportunity
*/
CRMContacts.GetByOpportunityId = function (cfg, opportunity_id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [guid], function (result) {
    cb(result.length === 0
      ? {
        message: "No approval found."
      }
      : null, result.length > 0
      ? new CRMContacts(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Create a CRM contact
*/
CRMContacts.Create = function (cfg, data, extraFields, cb) {
  cb = cb || function () {};
  const rowDict = [
  {
    name: "Id",
    row_name: "Id"
  },
  {
    name: "AccountId",
    row_name: "AccountId"
  },
  {
    name: "OwnerId",
    row_name: "OwnerId"
  },
  {
    name: "Title",
    row_name: "Title"
  },
  {
    name: "FirstName",
    row_name: "FirstName"
  },
  {
    name: "LastName",
    row_name: "LastName"
  },
  {
    name: "Email",
    row_name: "Email"
  },
  {
    name: "Department",
    row_name: "Department"
  }];
  const { query, params } = utils.createInsertOrUpdateStatementGivenData(cfg.db.db, 'crm_contacts', data, rowDict, extraFields, 'Id');
  
  dbcmd
    .cmd(cfg.pool, query, params, function (result) {
      console.log(result);
    }, function (err) {
      cb(err);
    });
};

// Expose it
module.exports = CRMContacts;