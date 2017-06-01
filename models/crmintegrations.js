const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  tablename = 'crm_integrations';

/**
* The organizations class
*/
var CRMIntegrations = function (details) {
  extend(this, details || {});
};

/**
 * Save any changes to the DB row
 */
CRMIntegrations.prototype.commit = function(cfg, cb) {
    cb = cb || function() {};
    var excludes = ['uid', 'created_at'],
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
    query += ' WHERE uid = ?';
    params.push(this.id);

    dbcmd.cmd(cfg.pool, query, params, function(result) {
        cb(null, this);
    }, function(err) {
        cb(err);
    });
};

/**
 * The various types of integrations
 */
CRMIntegrations.TYPES = {
  SALESFORCE: 'SALESFORCE',
  UNKNOWN: 'UNKNOWN'
};

/**
* Get the integrations for a particular organization
*/
CRMIntegrations.GetForOrgs = function (cfg, organizations, cb) {
  if (!Array.isArray(organizations)) {
    organizations = [organizations];
  }
  let orgids = [];
  for (let g = 0; g < organizations.length; g++) {
    orgids.push(organizations[g].id);
  }
  CRMIntegrations.GetForOrgIds(cfg, orgids, cb);
};

/**
* Get the integrations for a list of org ids
*/
CRMIntegrations.GetForOrgIds = function (cfg, organization_ids, cb) {
  cb = cb || function () {};
  if (!Array.isArray(organization_ids)) {
    organization_ids = [organization_ids];
  }
  dbcmd
    .cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id IN (?)', [organization_ids.join(', ')], function (result) {
      let ints = [];
      for (let i = 0; i < result.length; i++) {
        ints.push(new CRMIntegrations(result[i]));
      }
      cb(null, ints);
    }, function (err) {
      cb(err);
    });
};

/**
* Delete a specific CRM integration by its UQ
*/
CRMIntegrations.DeleteForUQ = function (cfg, orgid, uq, cb) {
  cb = cb || function () {};
  dbcmd
    .cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ? AND uq = ?', [orgid, uq], function (result) {
      cb(null);
    }, function (err) {
      cb(err);
    });
};

/**
* Get the integrations for a particular organization
*/
CRMIntegrations.GetForOrg = function (cfg, organization_id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ?', [organization_id], function (result) {
    let ints = [];
    for (let i = 0; i < result.length; i++) {
      ints.push(new CRMIntegrations(result[i]));
    }
    cb(result.length === 0
      ? {
        message: "No CRM integration found."
      }
      : null, result.length > 0
      ? ints
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get an org by its UQ (unique id that connects it to the 3rd party system)
*/
CRMIntegrations.GetByUQ = function (cfg, orgid, uq, cb) {
  cb = cb || function () {};
  //console.log("GETBYUQ", 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ? AND uq = ? LIMIT 1', orgid, uq);
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ? AND uq = ? LIMIT 1', [orgid, uq], function (result) {
    /*console.log("got: ", result.length > 0
      ? new CRMIntegrations(result[0])
      : null);*/
    cb(null, result.length > 0
      ? new CRMIntegrations(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get an org by its id
*/
CRMIntegrations.GetByUId = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid = ? LIMIT 1', [id], function (result) {
    cb(null, result.length > 0
      ? new CRMIntegrations(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Create an integration
*/
CRMIntegrations.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    uid: uuidV4().toString(),
    created_at: new Date(),
    updated_at: new Date(),
    organization_id: 0,
    crm_type: 'UNKNOWN'
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
      CRMIntegrations
        .GetByUId(cfg, _Defaults.uid, function (err, org) {
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
module.exports = CRMIntegrations;