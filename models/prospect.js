var dbcmd = require('../utils/dbcommand'),
md5 = require('md5'),
extend = require('extend'),
tablename = 'prospects';

/**
* The prospect class
*/
var Prospect = function(details) {
  extend(this, details || {});
};

/**
* Get a prospect by its id
*/
Prospect.GetById = function(cfg, id, cb) {
  cb = cb || function() {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0 ? {message: "No user found."} : null, result.length > 0 ? new Prospect(result[0]) : null);
  }, function(err) {
    cb(err);
  });
};


/**
* Create a account
*/
Prospect.Create = function(cfg, details, cb) {
  cb = cb || function() {};
  details = details || {};
  var _Defaults = {
    name: "",
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
  dbcmd.cmd(cfg.pool, query, params, function(result) {    
    Prospect.GetById(cfg, result.insertId, function(err, org) {
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
module.exports = Prospect;