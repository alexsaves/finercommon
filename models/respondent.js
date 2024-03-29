const dbcmd = require('../utils/dbcommand');
const utils = require('../utils/utils');
const md5 = require('md5');
const extend = require('extend');
const Response = require('../models/response');
const promise = require("bity-promise");
const tablename = 'respondents';

/**
 * The Respondent class
 */
var Respondent = function (details) {
    extend(this, details || {});
    if (this.variables && this.variables instanceof Buffer) {
        this.variables = JSON.parse(this.variables.toString());
    }
    if (this.answers && this.answers instanceof Buffer) {
        this.answers = JSON.parse(this.answers.toString());
    }
};

/**
 * Set the time zone
 */
Respondent.prototype.setTimeZone = function (cfg, tz, cb) {
    cb = cb || function () {};
    tz = parseInt(tz);
    if (!isNaN(tz) && tz != this.time_zone) {
        this.time_zone = tz;
        var query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET time_zone = ? WHERE id = ?',
            params = [this.time_zone, this.id];
        dbcmd.cmd(cfg.pool, query, params, function (result) {
            cb(null, this);
        }.bind(this), function (err) {
            cb(err);
        });
    } else {
        process.nextTick(() => {
            cb(null, this);
        });
    }
};

/**
 * Apply and save to the DB the answers for a survey
 */
Respondent.prototype.applyAnswersForSurvey = function (cfg, survey, data, cb) {
    cb = cb || function () {};
    if (arguments < 4) {
        throw new Error("applyAnswersForSurvey: missing some arguments.");
    } else {
        var ctx = this;
        Response.GetByRespondentAndSurvey(cfg, this.id, survey.guid, (err, responses) => {
            if (err) {
                console.log(err);
                cb(err);
            } else {
                // Add the new response collection
                responses.integrateNewAnswers(cfg, survey, data, ctx);
                responses.commit(cfg, (err) => {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, ctx);
                    }
                });
            }
        });
    }
};

/**
 * Apply and save to the DB the answers for a survey (ASYNC)
 */
Respondent.prototype.applyAnswersForSurveyAsync = function (cfg, survey, data) {
    return new Promise((resolve, reject) => {
        this.applyAnswersForSurvey(cfg, survey, data, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

/**
 * Get a list of respondents for a survey guid
 */
Respondent.GetBySurvey = function (cfg, guid, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE survey_guid = ?', [guid], function (result) {
        var res = [];
        for (var i = 0; i < result.length; i++) {
            res.push(new Respondent(result[i]));
        }
        cb(null, res);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get a list of respondents for a survey guid
 * @param {*} cfg
 * @param {*} guid
 */
Respondent.GetBySurveyAsync = function (cfg, guid) {
    return new Promise((resolve, reject) => {
        Respondent.GetBySurvey(cfg, guid, (err, resps) => {
            if (err) {
                reject(err);
            } else {
                resolve(resps);
            }
        });
    });
};

/**
 * Get a list of respondents for a survey guid
 */
Respondent.GetBySurveyAndTimeRange = function (cfg, guid, startDate, endDate, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE survey_guid = ? AND created_at > ? AND created_at < ?', [
        guid, startDate, endDate
    ], function (result) {
        var res = [];
        for (var i = 0; i < result.length; i++) {
            res.push(new Respondent(result[i]));
        }
        cb(null, res);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get a list of respondents for a survey guid
 */
Respondent.GetBySurveyAndTimeRangeAsync = function (cfg, guid, startDate, endDate) {
    return new Promise((resolve, reject) => {
        Respondent.GetBySurveyAndTimeRange(cfg, guid, startDate, endDate, (err, resp) => {
            if (err) {
                reject(err);
            } else {
                resolve(resp);
            }
        });
    });
};

/**
 * Get a list of respondents for a set of survey guids
 */
Respondent.GetBySurveysAndTimeRange = function (cfg, guids, startDate, endDate, cb) {
    cb = cb || function () {};
    if (guids.length === 0) {
        return cb(null, []);
    }
    let guiStrArr = ['('];
    let finalArgList = [];
    for (var i = 0; i < guids.length; i++) {
        if (i > 0) {
            guiStrArr.push(',');
        }
        guiStrArr.push("?");
        finalArgList.push(guids[i]);
    }
    guiStrArr.push(")");
    finalArgList.push(startDate);
    finalArgList.push(endDate);
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE survey_guid IN ' + guiStrArr.join('') + ' AND created_at > ? AND created_at < ?', finalArgList, function (result) {
        var res = [];
        for (var i = 0; i < result.length; i++) {
            res.push(new Respondent(result[i]));
        }
        cb(null, res);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get a list of respondents for a set of survey guids
 */
Respondent.GetBySurveysAndTimeRangeAsync = function (cfg, guids, startDate, endDate) {
    return new Promise((resolve, reject) => {
        Respondent.GetBySurveysAndTimeRange(cfg, guids, startDate, endDate, (err, resps) => {
            if (err) {
                reject(err);
            } else {
                resolve(resps);
            }
        });
    });
};

/**
 * Get a list of respondents for a survey guid
 */
Respondent.GetByOrgAndTimeRange = function (cfg, organization_id, startDate, endDate, cb) {
    let Survey = require('../models/survey');
    cb = cb || function () {};
    Survey.GetForOrganization(cfg, organization_id, (err, svs) => {
        if (err) {
            cb(err);
        } else {
            let svuids = svs.map((item) => {
                return item.guid;
            });
            if (svuids.length == 0) {
                cb(null, []);
            } else {
                var finalStr = "(";
                for (var k = 0; k < svuids.length; k++) {
                    if (k > 0) {
                        finalStr += ", ";
                    }
                    finalStr += "'" + svuids[k] + "'";
                }
                finalStr += ")";
                dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE survey_guid IN ' + finalStr + ' AND created_at > ? AND created_at < ?', [
                    startDate, endDate
                ], function (result) {
                    var res = [];
                    for (var i = 0; i < result.length; i++) {
                        res.push(new Respondent(result[i]));
                    }
                    cb(null, res);
                }, function (err) {
                    cb(err);
                });
            }
        }
    });
};

/**
 * Get a Respondent by its id
 */
Respondent.GetById = function (cfg, id, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
        cb(result.length === 0
            ? {
                message: "No respondent found."
            }
            : null, result.length > 0
            ? new Respondent(result[0])
            : null);
    }, function (err) {
        cb(err);
    });
};

/**
 * Delete all
 */
Respondent.DeleteAll = function (cfg, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id > 0', function () {
        cb();
    }, function (err) {
        cb(err);
    });
};

/**
 * Save any changes to the DB row
 */
Respondent.prototype.commit = function (cfg, cb) {
    cb = cb || function () {};
    var excludes = [
            'id', 'created_at'
        ],
        valKeys = Object.keys(this),
        query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET ',
        params = [],
        count = 0;
    if (!this.variables) {
        this.variables = {};
    }
    if (!this.answers) {
        this.answers = {};
    }
    this.updated_at = new Date();
    for (var elm in valKeys) {
        if (excludes.indexOf(valKeys[elm]) == -1) {
            if (count > 0) {
                query += ', ';
            }
            query += valKeys[elm] + ' = ?';
            if (typeof this[valKeys[elm]] == "object" && !(this[valKeys[elm]]instanceof Date)) {
                params.push(Buffer.from(JSON.stringify(this[valKeys[elm]])));
            } else {
                params.push(this[valKeys[elm]]);
            }
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

/**
 * Create a Respondent
 */
Respondent.Create = function (cfg, details, cb) {
    cb = cb || function () {};
    details = details || {};
    if (typeof details.approval_guid == 'undefined') {
        throw new Error("Missing approval GUID");
    }
    var _Defaults = {
        created_at: new Date(),
        updated_at: new Date(),
        variables: {},
        answers: {}
    };
    if (details.user_agent) {
        if (details.user_agent.length > 512) {
            details.user_agent = details
                .user_agent
                .substr(0, 511);
        }
    }
    extend(_Defaults, details);
    if (typeof _Defaults.variables == "object") {
        _Defaults.variables = Buffer.from(JSON.stringify(_Defaults.variables));
    }
    if (typeof _Defaults.answers == "object") {
        _Defaults.answers = Buffer.from(JSON.stringify(_Defaults.answers));
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
            Respondent
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
 * Create a respondent (ASYNC)
 */
Respondent.CreateAsync = function (cfg, details) {
    return new Promise((resolve, reject) => {
        Respondent.Create(cfg, details, (err, resp) => {
            if (err) {
                reject(err);
            } else {
                resolve(resp);
            }
        });
    });
};

// Expose it
module.exports = Respondent;