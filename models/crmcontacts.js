const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const uuidV4 = require('uuid/v4');
const utils = require('../utils/utils');
const tablename = 'crm_contacts';

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
 * Is this ID a CRM contact?
 * @param {Object} cfg 
 * @param {String} guid 
 */
CRMContacts.IsIDAContactAsync = function(cfg, guid) {
  return new Promise((resolve, reject) => {
    CRMContacts.GetById(cfg, guid, (err, cnt) => {
      if (err) {
        resolve(false);
      } else {
        resolve(!!cnt);
      }
    });
  });
}

/**
 * Get a CRM contact (ASYNC)
 * @param {*} cfg
 * @param {*} guid
 */
CRMContacts.GetByIdAsync = function (cfg, guid) {
  return new Promise((resolve, reject) => {
    CRMContacts.GetById(cfg, guid, (err, cnt) => {
      if (err) {
        reject(err);
      } else {
        resolve(cnt);
      }
    });
  });
};

/**
 * Get CRMContacts by an array of ids
 */
CRMContacts.GetByIds = function (cfg, oids, cb) {
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
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE Id IN ' + finalStr, function (result) {
      var res = [];
      for (var i = 0; i < result.length; i++) {
        res.push(new CRMContacts(result[i]));
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
 * Get contacts by an array of ids
 */
CRMContacts.GetByAccountIds = function (cfg, aids, cb) {
  cb = cb || function () {};
  if (aids && aids.length > 0) {
    var finalStr = "(";
    for (var k = 0; k < aids.length; k++) {
      if (k > 0) {
        finalStr += ", ";
      }
      finalStr += "'" + aids[k] + "'";
    }
    finalStr += ")";
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE AccountId IN ' + finalStr, function (result) {
      var res = [];
      for (var i = 0; i < result.length; i++) {
        res.push(new CRMContacts(result[i]));
      }
      cb(null, res);
    }, function (err) {
      cb(err);
    });
  } else {
    cb(null, []);
  }
};

/*
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
    }, {
      name: "AccountId",
      row_name: "AccountId"
    }, {
      name: "OwnerId",
      row_name: "OwnerId"
    }, {
      name: "Title",
      row_name: "Title"
    }, {
      name: "FirstName",
      row_name: "FirstName"
    }, {
      name: "LastName",
      row_name: "LastName"
    }, {
      name: "Email",
      row_name: "Email"
    }, {
      name: "Name",
      row_name: "Name"
    }, {
      name: "Department",
      row_name: "Department"
    }
  ];
  const {query, params} = utils.createInsertOrUpdateStatementGivenData(cfg.db.db, 'crm_contacts', data, rowDict, extraFields, 'Id');

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    console.log(result);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = CRMContacts;