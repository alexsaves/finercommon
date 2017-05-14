const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  tablename = 'file_uploads';

/**
* The organizations class
*/
var FileUploads = function (details) {
  extend(this, details || {});
};

/**
* Get an upload by its uid
*/
FileUploads.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No upload found."
      }
      : null, result.length > 0
      ? new FileUploads(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Create a account
*/
FileUploads.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    uid: uuidV4().toString(),
    created_at: new Date(),
    updated_at: new Date(),
    upload_type: 'unknown'
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
  dbcmd.cmd(cfg.pool, query, params, function (result) {
    FileUploads
      .GetById(cfg, _Defaults.uid, function (err, org) {
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

/**
 * Save any changes to the DB row
 */
FileUploads.prototype.commit = function (cfg, cb) {
  cb = cb || function () {};
  var excludes = [
      'uid', 'created_at'
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
  query += ' WHERE uid = ?';
  params.push(this.uid);

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    cb(null, this);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = FileUploads;