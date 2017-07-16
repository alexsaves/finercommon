const dbcmd = require('../utils/dbcommand'),
    md5 = require('md5'),
    extend = require('extend'),
    ResponseCollection = require('../models/responsecollection'),
    utils = require('../utils/utils'),
    tablename = 'responses';

/**
 * The Response class
 */
var Response = function(details) {
    extend(this, details || {});
};

/**
 * Merge new details with this response and save
 */
Response.prototype.updateWithResponse = function(cfg, details, qdef, cb) {
    cb = cb || function() {};
    if (arguments.length < 3) {
        cb(new Error("updateWithResponse: missing arguments."));
    } else {
        var qtype = qdef.type;
        //console.log("MERGING Q: ", qtype);
        //console.log("deets", details);
        switch (qtype) {
            case "rating":
                this.n_val = parseInt(details);
                break;
            case "radiogroup":
                this.short_ans = utils.enforceStringLength(details, 10);
                if (details == "other") {
                    this.other_selected = 1;
                } else {
                    this.other_selected = 0;
                }
                break;
            case "checkbox":
                this.medium_ans = utils.enforceStringLength(details.join(','), 100);
                if (details.indexOf('other') > -1) {
                    this.other_selected = 1;
                } else {
                    this.other_selected = 0;
                }
                break;
            case "text":
                this.long_ans = details;
                break;
        }
        this.commit(cfg, cb);
    }
};

/**
 * Merge new details with this OTHER response and save
 */
Response.prototype.updateWithOtherResponse = function(cfg, details, qdef, cb) {
    cb = cb || function() {};
    if (arguments.length < 3) {
        cb(new Error("updateWithOtherResponse: missing arguments."));
    } else {
        this.other_ans = utils.enforceStringLength(details, 100);
        this.other_selected = 1;
        this.commit(cfg, cb);
    }
};

/**
 * Save any changes to the DB row
 */
Response.prototype.commit = function(cfg, cb) {
    cb = cb || function() {};
    var excludes = ['id', 'created_at'],
        valKeys = Object.keys(this),
        query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET ',
        params = [],
        count = 0;
    this.updated_at = new Date();
    this.q_id = utils.enforceStringLength(this.q_id, 20);
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

    dbcmd.cmd(cfg.pool, query, params, function(result) {
        cb(null, this);
    }, function(err) {
        cb(err);
    });
};

/**
 * Delete all
 */
Response.DeleteAll = function (cfg, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id > 0', function () {
        cb();
    }, function (err) {
        cb(err);
    });
};

/**
 * Get a Response by its id
 */
Response.GetById = function(cfg, id, cb) {
    cb = cb || function() {};
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function(result) {
        cb(result.length === 0 ? { message: "No Response found with id " + id + "." } : null, result.length > 0 ? new Response(result[0]) : null);
    }, function(err) {
        cb(err);
    });
};

/**
 * Get all responses by their survey id
 */
Response.GetBySurvey = function(cfg, id, cb) {
    cb = cb || function() {};
    if (arguments.length < 3) {
        throw new Error("GetBySurvey: missing arguments.");
    }
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE survey_guid = ? ORDER BY updated_at DESC', [id], function(result) {
        var results = new ResponseCollection();
        for (let i = 0; i < result.length; i++) {
            results.addResponses(new Response(result[i]));
        }
        cb(null, results);
    }, function(err) {
        cb(err);
    });
};

/**
 * Get all responses by their respondent and survey
 */
Response.GetByRespondentAndSurvey = function(cfg, rid, sid, cb) {
    cb = cb || function() {};
    if (arguments.length < 4) {
        throw new Error("GetByResponsentAndSurvey: missing arguments.");
    }
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE survey_guid = ? AND respondent_id = ? ORDER BY updated_at DESC', [sid, rid], function(result) {
        var results = new ResponseCollection();
        for (let i = 0; i < result.length; i++) {
            results.addResponses(new Response(result[i]));
        }
        cb(null, results);
    }, function(err) {
        cb(err);
    });
};

/**
 * Create a Response
 */
Response.Create = function(cfg, details, cb) {
    cb = cb || function() {};
    details = details || {};
    var _Defaults = {
        created_at: new Date(),
        updated_at: new Date(),
        respondent_id: 0,
        survey_guid: '',
        q_id: '',
        n_val: 0,
        other_selected: 0
    };
    extend(_Defaults, details);
    _Defaults.q_id = utils.enforceStringLength(_Defaults.q_id, 20);
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
        Response.GetById(cfg, result.insertId, function(err, org) {
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
module.exports = Response;