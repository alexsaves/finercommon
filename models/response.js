const dbcmd = require('../utils/dbcommand'),
    md5 = require('md5'),
    extend = require('extend'),    
    utils = require('../utils/utils'),
    tablename = 'responses',
    RESPONSE_STATES = {
        NEW: 0,
        COMMITTED: 1,
        UPDATED: 2
    },
    ResponseCollection = require('../models/responsecollection');

/**
 * The Response class
 */
var Response = function (details, stateOptional = RESPONSE_STATES.NEW) {
    this._state = stateOptional;
    extend(this, details || {});
};

/**
 * Merge new details with this response and save
 */
Response.prototype.updateWithResponse = function (details, qdef) {
    if (arguments.length < 2) {
        cb(new Error("updateWithResponse: missing arguments."));
    } else {
        var respMD5 = md5(JSON.stringify(details));
        if (this._state == RESPONSE_STATES.COMMITTED) {
            if (this.response_md5 != respMD5) {
                this._state = RESPONSE_STATES.UPDATED;
            } else {
                // It hasn't changed!
                return;
            }
        }
        this.response_md5 = respMD5;
        var qtype = qdef.type;

        // Preclean INT and TEXT values
        for (let p = 0; p < 100; p++) {
            if (!isNaN(this["_int" + p])) {
                this["_int" + p] = null;
            } else {
                break;
            }
        }
        for (let p = 0; p < 100; p++) {
            if (this["text" + p] != null) {
                this["text" + p] = null;
            } else {
                break;
            }
        }

        switch (qtype) {
            case "buttons":
                this.intval = isNaN(parseInt(details))
                    ? null
                    : parseInt(details);
                break;
            case "button":
                this.intval = isNaN(parseInt(details))
                    ? null
                    : parseInt(details);
                break;
            case "rating":
                if (qdef.modifier && qdef.modifier.trim().toLowerCase() == "slider") {
                    this.floatval = isNaN(parseFloat(details))
                        ? null
                        : parseFloat(details);
                } else {
                    this.intval = isNaN(parseInt(details))
                        ? null
                        : parseInt(details);
                }
                break;
            case "checkbox":
                for (let k = 0; k < details.responses.length; k++) {
                    this["_int" + k] = isNaN(parseInt(details.responses[k]))
                        ? null
                        : parseInt(details.responses[k]);
                }
                if (details.responses.indexOf(9999) > -1) {
                    this.other_selected = 1;
                    this.other_openend = details.other || ""
                }
                break;
            case "radio":
                this.intval = isNaN(parseInt(details.response))
                    ? null
                    : parseInt(details.response);
                if (this.intval == 9999) {
                    this.other_selected = 1;
                    this.other_openend = details.other || ""
                }
                break;
            case "dropdown":
                this.intval = isNaN(parseInt(details))
                    ? null
                    : parseInt(details);
                break;
            case "text":
                this.openend = details;
                break;
            case "sort":
                for (let k = 0; k < details.order.length; k++) {
                    this["_int" + k] = isNaN(parseInt(details.order[k]))
                        ? null
                        : parseInt(details.order[k]);
                }
                if (details.other && details.other.trim().length > 0) {
                    this.other_selected = 1;
                    this.other_openend = details.other || ""
                }
                break;
            case "matrixrating":
                for (let k = 0; k < details.length; k++) {
                    this["_int" + k] = isNaN(parseInt(details[k]))
                        ? null
                        : parseInt(details[k]);
                }
                break;
            case "matrixradio":
                for (let k = 0; k < details.length; k++) {
                    this["_int" + k] = isNaN(parseInt(details[k]))
                        ? null
                        : parseInt(details[k]);
                }
                break;
            case "multitext":
                for (let k = 0; k < details.length; k++) {
                    this["text" + k] = details[k];
                }
                break;
            default:
                console.log("Unsupported question type: ", qtype);
                throw new Error("Unsupported save question type");
                break;
        }
    }
};

/**
 * Save any changes to the DB row
 */
Response.prototype.commit = function (cfg, cb) {
    if (this._state == RESPONSE_STATES.NEW) {
        Response.Create(cfg, this, cb);
    } else {
        cb = cb || function () {};
        var excludes = [
                'id', 'created_at', '_state'
            ],
            valKeys = Object.keys(this),
            query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET ',
            params = [],
            count = 0;
        this.updated_at = new Date();
        this.name = utils.enforceStringLength(this.name, 50);
        for (var elm in valKeys) {
            if (excludes.indexOf(valKeys[elm]) == -1 && typeof this[valKeys[elm]] != "function") {
                if (count > 0) {
                    query += ', ';
                }
                query += valKeys[elm] + ' = ?';
                if (elm.indexOf('text') == 0 && this[valKeys[elm]] != null) {
                    this[valKeys[elm]] = utils.enforceStringLength(this[valKeys[elm]], 256);
                }
                params.push(this[valKeys[elm]]);
                count++;
            }
        }
        query += ' WHERE id = ?';
        params.push(this.id);

        dbcmd.cmd(cfg.pool, query, params, (result) => {
            this._state = RESPONSE_STATES.COMMITTED;
            cb(null, this);
        }, function (err) {
            cb(err);
        });
    }
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
Response.GetById = function (cfg, id, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
        cb(result.length === 0
            ? {
                message: "No Response found with id " + id + "."
            }
            : null, result.length > 0
            ? new Response(result[0], RESPONSE_STATES.COMMITTED)
            : null);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get all responses by their survey id
 */
Response.GetBySurvey = function (cfg, id, cb) {
    cb = cb || function () {};
    if (arguments.length < 3) {
        throw new Error("GetBySurvey: missing arguments.");
    }
    dbcmd
        .cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE survey_guid = ? ORDER BY updated_at DESC', [id], function (result) {
            var results = new ResponseCollection();
            for (let i = 0; i < result.length; i++) {
                results.addResponses(new Response(result[i], RESPONSE_STATES.COMMITTED));
            }
            cb(null, results);
        }, function (err) {
            cb(err);
        });
};

/**
 * Get all responses by their respondent and survey
 */
Response.GetByRespondentAndSurvey = function (cfg, rid, sid, cb) {
    cb = cb || function () {};
    if (arguments.length < 4) {
        throw new Error("GetByResponsentAndSurvey: missing arguments.");
    }
    dbcmd
        .cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE survey_guid = ? AND respondent_id = ? ORDER BY updated_at DESC', [
            sid, rid
        ], function (result) {
            var results = new ResponseCollection();
            for (let i = 0; i < result.length; i++) {
                results.addResponses(new Response(Object.assign({}, result[i]), RESPONSE_STATES.COMMITTED));
            }
            cb(null, results);
        }, function (err) {
            cb(err);
        });
};

/**
 * Create a Response
 */
Response.Create = function (cfg, details, cb) {
    cb = cb || function () {};
    details = details || {};
    var _Defaults = {
        created_at: new Date(),
        updated_at: new Date(),
        respondent_id: 0,
        survey_guid: '',
        name: '',
        other_selected: 0
    };
    extend(_Defaults, details);
    _Defaults.name = utils.enforceStringLength(_Defaults.name, 50);
    var valKeys = Object.keys(_Defaults),
        excludes = [
            'id', '_state'
        ],
        query = 'INSERT INTO ' + cfg.db.db + '.' + tablename + ' SET ',
        params = [],
        count = 0;
    for (var elm in valKeys) {
        if (excludes.indexOf(valKeys[elm]) == -1 && typeof _Defaults[valKeys[elm]] != "function") {
            if (count > 0) {
                query += ', ';
            }
            query += valKeys[elm] + ' = ?';
            if (elm.indexOf('text') == 0 && _Defaults[valKeys[elm]] != null) {
                _Defaults[valKeys[elm]] = utils.enforceStringLength(_Defaults[valKeys[elm]], 256);
            }
            params.push(_Defaults[valKeys[elm]]);
            count++;
        }
    }
    dbcmd
        .cmd(cfg.pool, query, params, function (result) {
            Response
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
module.exports = Response;