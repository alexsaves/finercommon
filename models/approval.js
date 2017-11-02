const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  tablename = 'approvals',
  shortid = require('shortid'),
  Organization = require('../models/organization'),
  CRMIntegrations = require('../models/crmintegrations');

/**
* The account class
*/
var Approval = function (details) {
  extend(this, details || {});
};

/**
* Save any changes to the DB row
*/
Approval.prototype.commit = function (cfg, cb) {
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
  params.push(this.id);

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    cb(null, this);
  }, function (err) {
    cb(err);
  });
};

/**
* Get an approval by its id
*/
Approval.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No approval found."
      }
      : null, result.length > 0
      ? new Approval(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Delete all
*/
Approval.DeleteAll = function (cfg, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id > 0', function () {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
* Create an approval
*/
Approval.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    guid: shortid.generate(),
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
      Approval
        .GetById(cfg, result.insertId, function (err, user) {
          if (err) {
            cb(err);
          } else {
            cb(null, user);
          }
        });
    }, function (err) {
      cb(err);
    });
};

// Expose it
module.exports = Approval;