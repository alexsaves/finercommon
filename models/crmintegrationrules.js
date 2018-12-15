const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const uuidV4 = require('uuid/v4');
const tablename = 'crm_integration_rules';

/**
* The integration rules class
*/
var CRMIntegrationRules = function (details) {
  extend(this, details || {});
};

/**
* Save any changes to the DB row
*/
CRMIntegrationRules.prototype.commit = function (cfg, cb) {
  cb = cb || function () {};
  var excludes = [
      'id', 'created_at'
    ],
    valKeys = Object.keys(this),
    query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET ',
    params = [],
    count = 0;
  this.updated_at = new Date();
  for (var elm in valKeys) {
    if (excludes.indexOf(valKeys[elm]) == -1) {
      if (count > 0) {
        query += ', ';
      }
      query += valKeys[elm] + ' = ?';
      params.push(this[valKeys[elm]]);
      count++;
    }
  }
  query += ' WHERE id = ?';
  params.push(this.id || this.uid);

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    cb(null, this);
  }, function (err) {
    cb(err);
  });
};

/**
 * Which users are allowed to approve stuff?
 * @param {*} cfg
 * @param {*} cb
 */
CRMIntegrationRules.prototype.listUsersWhoCanApprove = function (cfg, cb) {
  dbcmd
    .cmd(cfg.pool, 'SELECT approvers FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [this.id], function (results) {
      results = results[0]
        .approvers
        .toString();
      if (results.length > 0) {
        if (results === `"*"`) {
          cb(null, results);
        } else {
          cb(null, JSON.parse(results));
        }
      } else {
        cb('No approvers found');
      }
    }, function (err) {
      cb(err);
    });
}

/**
 * Can a specific user approve?
 * @param {*} cfg
 * @param {*} userId
 * @param {*} cb
 */
CRMIntegrationRules.prototype.canUserApprove = function (cfg, userId, cb) {
  if (!userId) {
    cb('userId is required');
  }
  this.listUsersWhoCanApprove(cfg, (err, users) => {
    if (err) {
      cb(err);
    } else {
      if (users === `"*"` || (users && users.value == "all")) {
        cb(null, true);
      } else if (users.filter(u => u.value === userId).length > 0) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    }
  });
}

/**
 * Can a specific user approve?
 * @param {*} cfg
 * @param {*} userId
 * @param {*} cb
 */
CRMIntegrationRules.prototype.canUserApproveAsync = function (cfg, userId) {
  return new Promise((resolve, reject) => {
    this.canUserApprove(cfg, userId, (err, canthey) => {
      if (err) {
        reject(err);
      } else {
        resolve(canthey);
      }
    });
  });
};

/**
* Get an integration rule by its id
*/
CRMIntegrationRules.GetByUId = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ? LIMIT 1', [id], function (result) {
    cb(null, result.length > 0
      ? new CRMIntegrationRules(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get the integration rules for a particular integration
*/
CRMIntegrationRules.GetForIntegration = function (cfg, integration_id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE integration_id = ?', [integration_id], function (result) {
    let ints = [];
    for (let i = 0; i < result.length; i++) {
      ints.push(new CRMIntegrationRules(result[i]));
    }
    cb(result.length === 0
      ? {
        message: "No CRM integration rules found."
      }
      : null, result.length > 0
      ? ints
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Check to see if a user can approve with a rule set
 * @param {*} cfg
 * @param {*} userid
 */
CRMIntegrationRules.CanUserApproveWithTheseRules = async function (cfg, rules, userid) {
  var canthey = true;
  for (var i = 0; i < rules.length; i++) {
    var cantheysub = await rules[i].canUserApproveAsync(cfg, userid);
    if (!cantheysub) {
      return false;
    }
  }
  return true;
};

/**
* Delete a specific CRM integration by its UQ
*/
CRMIntegrationRules.Delete = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(null);
  }, function (err) {
    cb(err);
  });
};

/**
* Create an integration
*/
CRMIntegrationRules.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    id: uuidV4().toString(),
    updated_at: new Date(),
    created_at: new Date()
  };
  extend(_Defaults, details);
  var valKeys = Object.keys(_Defaults),
    query = 'INSERT INTO ' + cfg.db.db + '.' + tablename + ' SET ',
    params = [],
    count = 0;
  for (var elm in valKeys) {
    if (count > 0) {
      query += ', ';
    }
    query += valKeys[elm] + ' = ?';
    params.push(_Defaults[valKeys[elm]]);
    count++;
  }
  dbcmd
    .cmd(cfg.pool, query, params, function (result) {
      CRMIntegrationRules
        .GetByUId(cfg, _Defaults.id, function (err, rlz) {
          if (err) {
            cb(err);
          } else {
            cb(null, rlz);
          }
        });
    }, function (err) {
      cb(err);
    });
};


/**
* Create an integration (ASYNC)
*/
CRMIntegrationRules.CreateAsync = function (cfg, details) {
  return new Promise((resolve, reject) => {
    CRMIntegrationRules.Create(cfg, details, (err, rlz) => {
        if (err) {
            reject(err);
        } else {
            resolve(rlz);
        }
    });
});
};

// Expose it
module.exports = CRMIntegrationRules;