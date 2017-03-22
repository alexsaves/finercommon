var dbcmd = require('../utils/dbcommand'),
md5 = require('md5'),
extend = require('extend'),
tablename = 'accounts';

/**
* The account class
*/
var Account = function(details) {
  extend(this, details || {});
};

/**
* Get an account by its email and password
*/
Account.GetByEmailAndPassword = function(cfg, e, p, cb) {
  cb = cb || function() {};
  p = md5(p || '');
  
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ? AND pw_md5 = ?', [e, p], function (result) {
    cb(result.length === 0 ? {message: "No user found."} : null, result.length > 0 ? new Account(result[0]) : null);
  }, function(err) {
    cb(err);
  });
};

/**
* Get an account by its id
*/
Account.GetById = function(cfg, id, cb) {
  cb = cb || function() {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0 ? {message: "No user found."} : null, result.length > 0 ? new Account(result[0]) : null);
  }, function(err) {
    cb(err);
  });
};


/**
* Create a user
*/
Account.Create = function(cfg, details, cb) {
  cb = cb || function() {};
  details = details || {};
  var _Defaults = {
    name: "",
    created_at: new Date(),
    updated_at: new Date(),
    email: "",
    pw_md5: md5('')
  };
  if (details.password) {
    details.pw_md5 = md5(details.password);
    delete details.password;
  }
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
    Account.GetById(cfg, result.insertId, function(err, user) {
      if (err) {
        cb(err);
      } else {
        cb(null, user);
      }
    });
  }, function(err) {
    cb(err);
  });
};

// Expose it
module.exports = Account;