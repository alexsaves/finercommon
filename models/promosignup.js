const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  ses = require('node-ses'),
  fs = require('fs'),
  _ = require('underscore'),
  tablename = 'promo_signup';

/**
* Module for signup on the promo page
*/
var PromoSignup = function (details) {
  extend(this, details || {});
};

/**
* Get an upload by its uid
*/
PromoSignup.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No promo email found."
      }
      : null, result.length > 0
      ? new PromoSignup(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Get an signup by its Email
*/
PromoSignup.GetByEmail = function (cfg, eml, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ?', [eml], function (result) {
    cb(null, result.length > 0
      ? new PromoSignup(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Create an invitation
*/
PromoSignup.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
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
      PromoSignup
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
module.exports = PromoSignup;