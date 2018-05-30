const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const ses = require('node-ses');
const fs = require('fs');
const _ = require('underscore');
const tablename = 'email_charts';

/**
 * Module for signup on the promo page
 */
var EmailChart = function (details) {
  extend(this, details || {});
};

/**
 * Get an upload by its id
 */
EmailChart.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0 ? {
        message: "No chart found."
      } :
      null, result.length > 0 ?
      new EmailChart(result[0]) :
      null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Get an upload by its hash
 */
EmailChart.GetByHash = function (cfg, hash, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE img_hash = ?', [hash], function (result) {
    cb(result.length === 0 ? {
        message: "No chart found."
      } :
      null, result.length > 0 ?
      new EmailChart(result[0]) :
      null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Create a chart
 */
EmailChart.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    created_at: new Date(),
    updated_at: new Date()
  };
  extend(_Defaults, details);
  _Defaults.img_hash = md5(image_contents);
  EmailChart.GetByHash(cfg, _Defaults.img_hash, (err, res) => {
    if (err) {
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
          EmailChart
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
    } else {
      // It already exists. Update the updated-at value
      dbcmd
        .cmd(cfg.pool, 'INSERT INTO ' + cfg.db.db + '.' + tablename + ' SET updated_at = ? WHERE img_hash = ?', [new Date(), _Defaults.img_hash], function (result) {
          cb(null, res);
        });
    }
  });
};


// Expose it
module.exports = EmailChart;