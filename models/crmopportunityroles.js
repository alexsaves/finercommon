const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const uuidV4 = require('uuid/v4');
const utils = require('../utils/utils');
const CRMContacts = require('../models/crmcontacts');
const tablename = 'crm_opportunity_roles ';

/**
* The crm CRMOpportunityRoles class
*/
var CRMOpportunityRoles = function (details) {
  extend(this, details || {});
};


/*
* Get all Contact by their opportunity
*/
CRMOpportunityRoles.GetByOpportunityId = function (cfg, opportunity_id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE OpportunityId = ?', [opportunity_id], function (result) {
    var rescol = [];
    for (let i = 0; i < result.length; i++) {
      rescol.push(new CRMOpportunityRoles(result[i]));
    }
    cb(result.length === 0
      ? {
        message: "No approval found."
      }
      : null, result.length > 0
      ? rescol
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Get all Contact by their opportunity with prepolulated contacts
 * @param {*} cfg 
 * @param {*} opportunity_id 
 * @param {*} cb 
 */
CRMOpportunityRoles.GetByOpportunityIdWithContacts = function (cfg, opportunity_id, cb) {
  CRMOpportunityRoles.GetByOpportunityId(cfg, opportunity_id, (err, clist) => {
    if (err) {
      cb(err);
    } else {
      let contactids = clist.map((c) => {
        return c.ContactId;
      });
      CRMContacts.GetByIds(cfg, contactids, (err, contactlist) => {
        if (err) {
          cb(err);
        } else {
          clist.forEach((c) => {
            c.contact = contactlist.find((cl) => {
              return cl.Id == c.ContactId;
            });
          });
          cb(null, clist);
        }
      });
    }
  })
};

/**
 * Get CRMOpportunityRoles by an array of ids
 */
CRMOpportunityRoles.GetByIds = function (cfg, oids, cb) {
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
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE OpportunityId IN ' + finalStr, function (result) {
      var res = [];
      for (var i = 0; i < result.length; i++) {
        res.push(new CRMOpportunityRoles(result[i]));
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
* Create a CRM contact
*/
CRMOpportunityRoles.Create = function (cfg, data, extraFields, cb) {
  cb = cb || function () {};
  const rowDict = [
    {
      name: "OpportunityId",
      row_name: "OpportunityId"
    }, {
      name: "ContactId",
      row_name: "ContactId"
    }, {
      name: "IsDeleted",
      row_name: "IsDeleted"
    }, {
      name: "IsPrimary",
      row_name: "IsPrimary"
    }, {
      name: "Role",
      row_name: "Role"
    },
  ];
  const {query, params} = utils.createInsertOrUpdateStatementGivenData(cfg.db.db,tablename, data, rowDict, extraFields, 'Id');

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    console.log(result);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = CRMOpportunityRoles;