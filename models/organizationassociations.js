var dbcmd = require('../../app/utils/dbcommand'),
md5 = require('md5'),
extend = require('extend'),
tablename = 'org_account_associations';

/**
* The organizations class
*/
var OrganizationAssociations = function(details) {
  extend(this, details || {});
};

/**
* Get an org by its id
*/
OrganizationAssociations.GetById = function(cfg, id, cb) {
  cb = cb || function() {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0 ? {message: "No user found."} : null, result.length > 0 ? new OrganizationAssociations(result[0]) : null);
  }, function(err) {
    cb(err);
  });
};


/**
* Create an association
*/
OrganizationAssociations.Create = function(cfg, details, cb) {
  cb = cb || function() {};
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
  dbcmd.cmd(cfg.pool, query, params, function(result) {    
    OrganizationAssociations.GetById(cfg, result.insertId, function(err, org) {
      if (err) {
        cb(err);
      } else {
        cb(null, org);
      }
    });
  }, function(err) {
    cb(err);
  });
};

// Expose it
module.exports = OrganizationAssociations;