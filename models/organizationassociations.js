const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  Account = require('../models/account'),
  tablename = 'org_account_associations';

/**
* The organizations class
*/
var OrganizationAssociations = function (details) {
  extend(this, details || {});
};

/**
 * Delete an association
 */
OrganizationAssociations.prototype.Delete = function(cfg, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [this.id], function (result) {
    cb(null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get an org by its id
*/
OrganizationAssociations.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No org associations found."
      }
      : null, result.length > 0
      ? new OrganizationAssociations(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get all associations by email
*/
OrganizationAssociations.GetAllByEmail = function (cfg, email, cb) {
  cb = cb || function () {};
  require('../models/account').GetByEmail(cfg, email, (err, act) => {
    if (err) {
      cb(err);
    } else {
      dbcmd
        .cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE account_id = ?', [act.id], function (result) {
          cb(null, (result && result.length > 0)
            ? [new OrganizationAssociations(result[0])]
            : null);
        }, function (err) {
          cb(err);
        });
    }
  });
};

/**
 * Remove an association by user and org
 */
OrganizationAssociations.DeleteForAccountAndOrganization = function (cfg, actid, orgid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ? && account_id = ?', [
    orgid, actid
  ], function (result) {
    cb(null);
  }, function (err) {
    cb(err);
  });
};

/**
* Delete for an org
*/
OrganizationAssociations.DeleteForOrganization = function (cfg, orgid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ?', [orgid], function (result) {
    cb(null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get associations by org id and account
*/
OrganizationAssociations.GetForOrgAndAccount = function (cfg, orgid, accountid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ? AND account_id = ?', [
    orgid, accountid
  ], function (result) {
    cb(null, result.length > 0
      ? new OrganizationAssociations(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Delete all
 */
OrganizationAssociations.DeleteAll = function (cfg, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id > 0', function () {
        cb();
    }, function (err) {
        cb(err);
    });
};

/**
* Get all associations for an org
*/
OrganizationAssociations.GetAllForOrg = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ?', [id], function (results) {
    var res = [];
    results.forEach((assoc) => {
      res.push(new OrganizationAssociations(assoc));
    });
    let accountids = [];
    res.forEach(function (asc) {
      accountids.push(asc.account_id);
    });
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.accounts WHERE id IN (' + accountids.join(',') + ')', function (accounts) {
      res.forEach((assc) => {
        assc.account = accounts.find((act) => {
          return act.id == assc.account_id;
        });
      });
      cb(null, res);
    }, function (err) {
      cb(err);
    });
  }, function (err) {
    cb(err);
  });
};

/**
* Create an association
*/
OrganizationAssociations.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    created_at: new Date(),
    updated_at: new Date(),
    account_id: 0,
    organization_id: 0,
    assoc_type: 0
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
      OrganizationAssociations
        .GetById(cfg, result.insertId, function (err, org) {
          if (err) {
            cb(err);
          } else {
            cb(null, org);
          }
        });
    }, function (err) {
      cb(err);
    });
};

// Expose it
module.exports = OrganizationAssociations;