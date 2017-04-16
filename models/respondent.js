var dbcmd = require('../utils/dbcommand'),
    utils = require('../utils/utils'),
    md5 = require('md5'),
    extend = require('extend'),
    Response = require('../models/response'),
    promise = require("bity-promise"),
    tablename = 'respondents';

/**
 * The Respondent class
 */
var Respondent = function(details) {
    extend(this, details || {});
};

/**
 * Set the time zone
 */
Respondent.prototype.setTimeZone = function(cfg, tz, cb) {
    cb = cb || function() {};
    this.time_zone = parseInt(tz);
    var query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET time_zone = ? WHERE id = ?',
        params = [this.time_zone, this.id];
    dbcmd.cmd(cfg.pool, query, params, function(result) {
        cb(null, this);
    }.bind(this), function(err) {
        cb(err);
    });
};

/**
 * Apply and save to the DB the answers for a survey
 */
Respondent.prototype.applyAnswersForSurvey = function(cfg, survey, data, cb) {
    cb = cb || function() {};
    if (arguments < 4) {
        throw new Error("applyAnswersForSurvey: missing some arguments.");
    } else {
        var okeys = Object.keys(data),
            existingResponses = Response.GetByRespondentAndSurvey(cfg, this.id, survey.guid, function(err, responses) {
                if (err) {
                    cb(err);
                } else {
                    var commitProm = new promise(function() {
                        cb(null, {});
                    }, function() {
                        cb(new Error("Did not save responses."));
                    }, 10000);
                    commitProm.make(okeys);
                    for (let i = 0; i < okeys.length; i++) {
                        var questionkey = okeys[i],
                            qdef = survey.getQuestionById(questionkey);
                        if (!qdef) {
                            cb(new Error("Could not find question id " + questionkey + " in survey " + survey.guid + "."));
                            return;
                        } else {
                            let existingResponse = responses.getFirstMatching({
                                q_id: questionkey
                            });

                            if (!existingResponse) {
                                // New response, let's set it up
                                Response.Create(cfg, {
                                    respondent_id: this.id,
                                    survey_guid: survey.guid,
                                    q_id: qdef.name
                                }, function(key) {
                                    return function(err, resp) {
                                        if (err) {
                                            console.log(err);
                                            commitProm.break(key);
                                        } else {
                                            if (utils.isOtherLabel(key)) {
                                                resp.updateWithOtherResponse(cfg, data[key], qdef, function(err, resp) {
                                                    if (err) {
                                                        commitProm.break(key);
                                                    } else {
                                                        commitProm.resolve(key);
                                                    }
                                                });
                                            } else {
                                                resp.updateWithResponse(cfg, data[key], qdef, function(err, resp) {
                                                    if (err) {
                                                        commitProm.break(key);
                                                    } else {
                                                        commitProm.resolve(key);
                                                    }
                                                });
                                            }
                                        }
                                    };
                                }(questionkey));
                            } else {
                                if (utils.isOtherLabel(questionkey)) {
                                    existingResponse.updateWithOtherResponse(cfg, data[questionkey], qdef, function(key) {
                                        return function(err, resp) {
                                            if (err) {
                                                commitProm.break(key);
                                            } else {
                                                commitProm.resolve(key);
                                            }
                                        };
                                    }(questionkey));
                                } else {
                                    existingResponse.updateWithResponse(cfg, data[questionkey], qdef, function(key) {
                                        return function(err, resp) {
                                            if (err) {
                                                commitProm.break(key);
                                            } else {
                                                commitProm.resolve(key);
                                            }
                                        };
                                    }(questionkey));
                                }
                            }
                        }
                    }
                }
            }.bind(this));
    }
};

/**
 * Get a Respondent by its id
 */
Respondent.GetById = function(cfg, id, cb) {
    cb = cb || function() {};
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function(result) {
        cb(result.length === 0 ? { message: "No respondent found." } : null, result.length > 0 ? new Respondent(result[0]) : null);
    }, function(err) {
        cb(err);
    });
};

/**
 * Create a Respondent
 */
Respondent.Create = function(cfg, details, cb) {
    cb = cb || function() {};
    details = details || {};
    var _Defaults = {
        created_at: new Date(),
        updated_at: new Date()
    };
    if (details.user_agent) {
        if (details.user_agent.length > 512) {
            details.user_agent = details.user_agent.substr(0, 511);
        }
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
        Respondent.GetById(cfg, result.insertId, function(err, org) {
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
module.exports = Respondent;