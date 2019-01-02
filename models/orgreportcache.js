const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const tablename = 'org_report_cache';
const zlib = require('zlib');

/**
* The OrgReportCache class
*/
var OrgReportCache = function (details) {
  extend(this, details || {});
  if (this.report && this.report instanceof Buffer) {
    // Compress it
    this.report = zlib.inflateRawSync(this.report);
  }
};

/**
 * The types of reports
 */
OrgReportCache.REPORT_TYPE = {
  MONTHLY_SUMMARY: 0,
  MONTHLY_PRIMARYREASONS: 1
};

/**
* Delete this report
*/
OrgReportCache.prototype.Delete = function (cfg, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, "DELETE FROM " + cfg.db.db + "." + tablename + " WHERE id = ?", [this.id], function (result) {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
* Get a report by its id
*/
OrgReportCache.GetById = function (cfg, id, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No invitation found."
      }
      : null, result.length > 0
        ? new OrgReportCache(result[0])
        : null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Get all the reports for an organization by a certain type
 * @param {*} cfg 
 * @param {*} orgid 
 * @param {*} reptype 
 * @param {*} cb 
 */
OrgReportCache.GetReportsForOrgAndType = function (cfg, orgid, reptype, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ? AND report_type = ?', [orgid, reptype], function (result) {
    var reps = [];
    for (let i = 0; i < result.length; i++) {
      reps.push(new OrgReportCache(result[i]));
    }
    cb(null, reps);
  }, function (err) {
    cb(err);
  });
};

/**
 * Get all the reports for an organization by a certain type (ASYNC)
 * @param {*} cfg 
 * @param {*} orgid 
 * @param {*} reptype 
 */
OrgReportCache.GetReportsForOrgAndTypeAsync = function (cfg, orgid, reptype) {
  return new Promise((resolve, reject) => {
    OrgReportCache.GetReportsForOrgAndType(cfg, orgid, reptype, (err, reps) => {
      if (err) {
        reject(err);
      } else {
        resolve(reps);
      }
    });
  });
};

/**
 * Delete all
 */
OrgReportCache.DeleteAll = function (cfg, cb) {
  cb = cb || function () { };
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id > 0', function () {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
 * Delete all (ASYNC)
 */
OrgReportCache.DeleteAllAsync = function (cfg) {
  return new Promise((resolve, reject) => {
    OrgReportCache.DeleteAll(cfg, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
* Create a OrgReportCache
*/
OrgReportCache.Create = function (cfg, details, cb) {
  cb = cb || function () { };
  details = details || {};
  var _Defaults = {
    created_at: new Date(),
    updated_at: new Date()
  };
  extend(_Defaults, details);

  if (_Defaults.report) {
    if (!_Defaults.report instanceof Buffer) {
      _Defaults.report = new Buffer(_Defaults.report);
    }
    // Compress it
    _Defaults.report = zlib.deflateRawSync(_Defaults.report);
  }

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
      OrgReportCache
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

/**
 * Create a report (ASYNC)
 * @param {*} cfg 
 * @param {*} details 
 */
OrgReportCache.CreateAsync = function (cfg, details) {
  return new Promise((resolve, reject) => {
    OrgReportCache.Create(cfg, details, (err, rep) => {
      if (err) {
        reject(err);
      } else {
        resolve(rep);
      }
    });
  });
};

/**
 * Save any changes to the DB row
 */
OrgReportCache.prototype.commit = function (cfg, cb) {
  cb = cb || function () { };
  var excludes = [
    'uid', 'created_at'
  ],
    valKeys = Object.keys(this),
    query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET ',
    params = [],
    count = 0;
  if (this.report) {
    this.report = zlib.deflateRawSync(this.report);
  }
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

// Expose it
module.exports = OrgReportCache;