const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  tablename = 'email_unsubscriptions',
  btoa = require('btoa');

/**
* The organizations class
*/
var EmailUnsubscriptions = function (details) {
  extend(this, details || {});
};

/**
* Delete this invitation
*/
EmailUnsubscriptions.prototype.Delete = function (cfg, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, "DELETE FROM " + cfg.db.db + "." + tablename + " WHERE id = ?", [this.uid], function (result) {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
* Get an upload by its Id
*/
EmailUnsubscriptions.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No invitation found."
      }
      : null, result.length > 0
      ? new EmailUnsubscriptions(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Delete any pending invitations for a particular id
*/
EmailUnsubscriptions.DeleteForOrgId = function (cfg, orgid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, "DELETE FROM " + cfg.db.db + "." + tablename + " WHERE organization_id = ?", [orgid], function (result) {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
* Delete all
*/
EmailUnsubscriptions.DeleteAll = function (cfg, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id > 0', function () {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
 * Return a link to unsubscribe a user
 * @param {String} email 
 */
EmailUnsubscriptions.GenerateValidUnsubscribeLink = function(email, org) {
  if (arguments.length < 2) {
    throw new Error("Missing email args.");
  }
  email = email.trim().toLowerCase();
  return "/unsubscribe?email=" + encodeURIComponent(email) + "&o=" + encodeURIComponent(org) + "&secure=" + encodeURIComponent(md5(email + "_" + org + "_sub1"));  
};

/**
 * Validate an unsubscribe link
 * @param {String} email 
 */
EmailUnsubscriptions.ValidateUnsubscribeLink = function(email, org, secure) {
  if (arguments.length < 3) {
    throw new Error("Missing email args.");
  }
  email = email.trim().toLowerCase();
  var hsh = md5(email + "_" + org + "_sub1");
  return !!email && secure === hsh;
};

/**
* Create an invitation
*/
EmailUnsubscriptions.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    created_at: new Date(),
    updated_at: new Date(),
    organization_id: 0
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
      EmailUnsubscriptions
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
EmailUnsubscriptions.prototype.commit = function (cfg, cb) {
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
  params.push(this.uid);

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    cb(null, this);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = EmailUnsubscriptions;