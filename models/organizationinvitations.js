const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  tablename = 'org_invitations';

/**
* The organizations class
*/
var OrganizationInvitation = function (details) {
  extend(this, details || {});
};

/**
* Get an invite by its uid
*/
OrganizationInvitation.GetByUID = function (cfg, uid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid = ?', [uid], function (result) {
    cb(result.length === 0
      ? {
        message: "No org invites found."
      }
      : null, result.length > 0
      ? new OrganizationInvitation(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Is there an invite for an organization and a specific email?
*/
OrganizationInvitation.GetForEmailAndOrg = function (cfg, email, orgid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ? AND organization_id = ? LIMIT 1', [email, orgid], function (result) {
    let res = null;
    if (result && result.length > 0) {
      res = new OrganizationInvitation(result[0]);
    }
    cb(null, res);
  }, function (err) {
    cb(err);
  });
};

/**
* Get all invites by email
*/
OrganizationInvitation.GetAllByEmail = function (cfg, email, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ?', [email], function (result) {
    let list = [];
    for (let i = 0; i < results.length; i++) {
      list.push(new OrganizationInvitation(result[i]));
    }
    cb(null, list);
  }, function (err) {
    cb(err);
  });
};

/**
 * Save any changes to the DB row
 */
OrganizationInvitation.prototype.commit = function (cfg, cb) {
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

/**
* Create an invitation
*/
OrganizationInvitation.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    uid: uuidV4().toString(),
    created_at: new Date(),
    updated_at: new Date(),
    organization_id: 0,
    invited_by_account_id: 0,
    email: '',
    assoc_type: 0
  };
  extend(_Defaults, details);
  _Defaults.email = _Defaults.email.trim().toLowerCase();
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
      OrganizationInvitation
        .GetByUID(cfg, _Defaults.uid, function (err, org) {
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
module.exports = OrganizationInvitation;