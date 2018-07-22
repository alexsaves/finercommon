const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const uuidV4 = require('uuid/v4');
const utils = require('../utils/utils');
const tablename = 'crm_users';

/**
* The crm accounts class
*/
var CRMUsers = function (details) {
  extend(this, details || {});
};

/**
 * Get users by an array of ids
 */
CRMUsers.GetByIds = function (cfg, oids, cb) {
  cb = cb || function () { };
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
        res.push(new CRMUsers(result[i]));
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
 * Get the list of users
 * @param {Object} cfg 
 * @param {Array} oids 
 */
CRMUsers.GetByIdsAsync = function (cfg, oids) {
  return new Promise((resolve, reject) => {
    CRMUsers.GetByIds(cfg, oids, (err, ids) => {
      if (err) {
        reject(err);
      } else {
        resolve(ids);
      }
    });
  });
};

CRMUsers.GetAllGivenIntegrationId = function (cfg, integrationId, cb) {
  cb = cb || function () { };
  if (integrationId) {
    dbcmd
      .cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE integration_id = ? ', [integrationId], function (result) {
        var res = [];
        for (var i = 0; i < result.length; i++) {
          res.push(new CRMUsers(result[i]));
        }
        cb(null, res);
      }, function (err) {
        cb(err);
      });
  } else {
    cb(null, []);
  }
}

/**
* Get a user by their id
*/
CRMUsers.GetById = function (cfg, guid, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE Id = ?', [guid], function (result) {
    cb(result.length === 0
      ? {
        message: "No opportunity found."
      }
      : null, result.length > 0
        ? new CRMUsers(result[0])
        : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Create an integration
*/
CRMUsers.Create = function (cfg, data, extraFields, cb) {
  cb = cb || function () { };
  const rowDict = [
    {
      name: "FirstName",
      row_name: "FirstName"
    }, {
      name: "LastName",
      row_name: "LastName"
    }, {
      name: "Name",
      row_name: "name"
    }, {
      name: "Id",
      row_name: "Id"
    }, {
      name: "Username",
      row_name: "Username"
    }, {
      name: "Email",
      row_name: "Email"
    }
  ];
  const { query, params } = utils.createInsertOrUpdateStatementGivenData(cfg.db.db, 'crm_users', data, rowDict, extraFields);
  dbcmd.cmd(cfg.pool, query, params, function (result) { }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = CRMUsers;