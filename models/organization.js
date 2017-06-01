const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  tablename = 'organizations',
  CRMIntegrations = require('../models/crmintegrations');

/**
* The organizations class
*/
var Organization = function (details) {
  extend(this, details || {});
};

/**
 * Get the list of integrations for an organization
 */
Organization.prototype.getIntegrations = function(cfg, cb) {
  CRMIntegrations.GetForOrg(cfg, this.id, cb);
};

/**
* Get the organizations for a particular account
*/
Organization.GetForAccount = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.org_account_associations WHERE account_id = ?', [id], function (result) {    
    if (result.length == 0) {
      cb(null, []);
    } else {
      let idlist = [];
      for (let t = 0; t < result.length; t++) {
        idlist.push(result[t].organization_id);
      }
      dbcmd
        .cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id IN (?)', [idlist.join(', ')], function (result) {
          let outOrgs = [];
          for (let h = 0; h < result.length; h++) {
            outOrgs.push(new Organization(result[h]));
          }
          cb(null, outOrgs);
        }, function (err) {
          cb(err);
        });
    }
  }, function (err) {
    cb(err);
  });
};

/**
* Get an org by its id
*/
Organization.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No user found."
      }
      : null, result.length > 0
      ? new Organization(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Create a account
*/
Organization.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    name: "",
    created_at: new Date(),
    updated_at: new Date()
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
      Organization
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
module.exports = Organization;