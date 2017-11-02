const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  uuidV4 = require('uuid/v4'),
  utils = require('../utils/utils'),
  tablename = 'crm_contacts';

/**
* The crm accounts class
*/
var CRMContacts = function (details) {
  extend(this, details || {});
};


/**
* Get an Contact by its id
*/
CRMContacts.GetById = function (cfg, guid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [guid], function (result) {
    cb(result.length === 0
      ? {
        message: "No approval found."
      }
      : null, result.length > 0
      ? new CRMContacts(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};


/**
* Create a CRM contact
*/
CRMContacts.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    id: shortid.generate(),
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
      CRMContacts
        .GetById(cfg, _Defaults.id, function (err, user) {
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
module.exports = CRMContacts;