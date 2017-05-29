const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  tablename = 'crm_integrations';

/**
* The organizations class
*/
var CRMIntegrations = function (details) {
  extend(this, details || {});
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
        message: "No user found."
      }
      : null, result.length > 0
      ? ints
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get an org by its id
*/
CRMIntegrations.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ? LIMIT 1', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No user found."
      }
      : null, result.length > 0
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
module.exports = CRMIntegrations;