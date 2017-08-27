const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  tablename = 'reset_pw_invitations';

/**
* The organizations class
*/
var ResetPWInvitations = function (details) {
  extend(this, details || {});
};

/**
* Delete this invitation
*/
ResetPWInvitations.prototype.Delete = function (cfg, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, "DELETE FROM " + cfg.db.db + "." + tablename + " WHERE uid = ?", [this.uid], function (result) {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
* Get an upload by its uid
*/
ResetPWInvitations.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No invitation found."
      }
      : null, result.length > 0
      ? new ResetPWInvitations(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Delete any pending invitations for a particular id
*/
ResetPWInvitations.DeleteForAccountId = function (cfg, accountid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, "DELETE FROM " + cfg.db.db + "." + tablename + " WHERE account_id = ?", [accountid], function (result) {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
 * Delete all
 */
ResetPWInvitations.DeleteAll = function (cfg, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid != NULL', function () {
        cb();
    }, function (err) {
        cb(err);
    });
};

/**
* Create an invitation
*/
ResetPWInvitations.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    uid: uuidV4().toString(),
    created_at: new Date(),
    updated_at: new Date(),
    account_id: 0
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
      ResetPWInvitations
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
ResetPWInvitations.prototype.commit = function (cfg, cb) {
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
module.exports = ResetPWInvitations;