const dbcmd = require('../utils/dbcommand');
const utils = require('../utils/utils');
const md5 = require('md5');
const extend = require('extend');
const tablename = 'surveys';
const shortid = require('shortid');
const check = require('check-types');
const utf8 = require('utf8');
const fs = require('fs');
const SurveyValueExtractor = require('../models/surveyvalueextractor');
const Piper = require('../models/piper');
const Respondent = require('../models/respondent');

// Fixtures
const prospect_survey_fixture = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/surveys/questionnaire.json').toString('utf-8'));
const internal_survey_fixture = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/surveys/salesquestionnaire.json').toString('utf-8'));

/**
 * The survey class
 */
var Survey = function (details) {
    extend(this, details || {});
    if (this.survey_model && this.survey_model instanceof Buffer) {
        this.survey_model = JSON.parse(this.survey_model.toString());
    }
};

/**
 * The types of surveys
 */
Survey.SURVEY_TYPES = {
    PROSPECT: 0,
    EMPLOYEE: 1
};

/**
 * Styles and themes
 */
Survey.SURVEY_THEMES = {
    LIGHT: "bokehlight",
    DARK: "bokehdark"
};

/**
 * Save this instance of a survey to the DB
 */
Survey.prototype.commit = function (cfg, cb) {
    cb = cb || function () { };
    if (check.string(this.survey_model)) {
        this.survey_model = Buffer.from(this.survey_model);
    }
    var update = dbcmd.constructUpdate(this, tablename, cfg.db.db, "guid", this.guid);
    dbcmd.cmd(cfg.pool, update.query, update.params, function (result) {
        cb(null, this);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get a question object by its id
 */
Survey.prototype.getQuestionByName = function (name) {
    if (this.survey_model) {
        var pgs = this.survey_model.pages;
        var _id = name + '';
        for (let i = 0; i < pgs.length; i++) {
            let pg = pgs[i],
                qs = pg.elements;
            if (qs) {
                for (let k = 0; k < qs.length; k++) {
                    let q = qs[k];
                    if (q.name == _id) {
                        return q;
                    }
                }
            }
        }
    }
    return;
};

/**
 * Get all the respondents for this survey (ASYNC)
 */
Survey.prototype.getRespondentsAsync = async function (cfg) {
    return await Respondent.GetBySurveyAsync(cfg, this.guid);
};

/**
 * Get a fully piped survey
 * @param {*} respondent 
 */
Survey.prototype.getPipedModel = function (respondent) {
    var finalModel = JSON.parse(JSON.stringify(this.survey_model));
    let respVars = respondent.variables;
    let exter = new SurveyValueExtractor();
    let piper = new Piper();
    finalModel.pages.forEach((pg) => {
        pg.elements.forEach((elm) => {
            if (elm.title) {
                elm.title = piper.pipe(elm.title, respondent.answers, finalModel, respVars, {});
            }
            if (elm.subtitle) {
                elm.subtitle = piper.pipe(elm.subtitle, respondent.answers, finalModel, respVars, {});
            }
            if (elm.choices) {
                for (let b = 0; b < elm.choices.length; b++) {
                    elm.choices[b] = piper.pipe(elm.choices[b], respondent.answers, finalModel, respVars, {});
                    if (elm.choices[b] == null || elm.choices[b].length == 0) {
                        elm.choices.splice(b--, 1);
                    }
                }
            }
        });
    });
    return finalModel;
};

/**
 * Create a new respondent with the data
 */
Survey.prototype.saveRespondent = function (cfg, respondent, data, cb) {
    if (arguments.length > 4) {
        throw new Error("saveRespondent: missing some arguments.");
    } else {
        respondent.applyAnswersForSurvey(cfg, this, data, cb);
    }
};

/**
 * Apply the default fixture (you still need to commit this)
 */
Survey.prototype.applyDefaultSurveyFixture = function () {
    this.survey_model = JSON.stringify(Survey.getSurveyFixture());
};

/**
 * Apply the default fixture (you still need to commit this)
 */
Survey.getSurveyFixture = function (SURVEY_TYPE) {
    switch (SURVEY_TYPE) {
        case Survey.SURVEY_TYPES.PROSPECT:
            return JSON.parse(JSON.stringify(prospect_survey_fixture));
        case Survey.SURVEY_TYPES.EMPLOYEE:
            return JSON.parse(JSON.stringify(internal_survey_fixture));
        default:
            throw new Error("Missing Survey Fixture Type");
    }
};

/**
 * Get a survey by its guid
 */
Survey.GetByGuid = function (cfg, guid, cb) {
    cb = cb || function () { };
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE guid = ?', [guid], function (result) {
        cb(result.length === 0
            ? {
                message: "No survey found."
            }
            : null, result.length > 0
                ? new Survey(result[0])
                : null);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get surveys by the organization
 */
Survey.GetForOrganization = function (cfg, organization_id, cb) {
    cb = cb || function () { };
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ?', [organization_id], function (result) {
        var res = [];
        for (var i = 0; i < result.length; i++) {
            res.push(new Survey(result[i]));
        }
        cb(null, res);
    }, function (err) {
        cb(err);
    });
};

/**
 * 
 * @param {DB Config} cfg 
 * @param {Number} organization_id 
 */
Survey.GetForOrganizationAsync = function (cfg, organization_id) {
    return new Promise((resolve, reject) => {
        Survey.GetForOrganization(cfg, organization_id, (err, svs) => {
            if (err) {
                reject(err);
            } else {
                resolve(svs);
            }
        });
    });
};


/**
 * Get surveys by the organization
 */
Survey.GetForOrganizationAndType = function (cfg, organization_id, SURVEY_TYPE, cb, startDateExclusive = null, endDateInclusive = null) {
    cb = cb || function () { };
    let dateFilter = "";
    if (!startDateExclusive) {
        startDateExclusive = new Date(0);
    }
    if (!endDateInclusive) {
        endDateInclusive = new Date(9999, 1);
    }
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ? AND survey_type = ? AND created_at >= ? AND created_at < ?', [organization_id, SURVEY_TYPE, startDateExclusive, endDateInclusive], function (result) {
        var res = [];
        for (var i = 0; i < result.length; i++) {
            res.push(new Survey(result[i]));
        }
        cb(null, res);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get surveys by the organization
 * @param {*} cfg 
 * @param {*} organization_id 
 * @param {*} SURVEY_TYPE 
 */
Survey.GetForOrganizationAndTypeAsync = function (cfg, organization_id, SURVEY_TYPE, startDateExclusive = null, endDateInclusive = null) {
    return new Promise((resolve, reject) => {
        Survey.GetForOrganizationAndType(cfg, organization_id, SURVEY_TYPE, (err, svs) => {
            if (err) {
                reject(err);
            } else {
                resolve(svs);
            }
        }, startDateExclusive, endDateInclusive);
    });
};

/**
 * Get surveys by the organizations
 */
Survey.GetForOrganizations = function (cfg, orgs, cb) {
    cb = cb || function () { };
    if (!orgs || orgs.length == 0) {
        cb(null, []);
    } else {
        var finalStr = "(";
        for (var k = 0; k < orgs.length; k++) {
            if (k > 0) {
                finalStr += ", ";
            }
            finalStr += "" + orgs[k].id + "";
        }
        finalStr += ")";
        dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id IN ' + finalStr, function (result) {
            var res = [];
            for (var i = 0; i < result.length; i++) {
                res.push(new Survey(result[i]));
            }
            cb(null, res);
        }, function (err) {
            cb(err);
        });
    }
};

/**
 * Get surveys by an array of ids
 */
Survey.GetByGuids = function (cfg, svuids, cb) {
    cb = cb || function () { };
    if (svuids && svuids.length > 0) {
        var finalStr = "(";
        for (var k = 0; k < svuids.length; k++) {
            if (k > 0) {
                finalStr += ", ";
            }
            finalStr += "'" + svuids[k] + "'";
        }
        finalStr += ")";
        dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE guid IN ' + finalStr, function (result) {
            var res = [];
            for (var i = 0; i < result.length; i++) {
                res.push(new Survey(result[i]));
            }
            cb(null, res);
        }, function (err) {
            cb(err);
        });
    } else {
        cb(null, []);
    }
};

/**
 * Get a survey by its opportunity ID and type
 */
Survey.GetForOpportunityAndType = function (cfg, opportunity_id, survey_type, cb) {
    cb = cb || function () { };
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE opportunity_id = ? AND survey_type = ?', [
        opportunity_id, survey_type
    ], function (result) {
        var svs = [];
        for (var i = 0; i < result.length; i++) {
            svs.push(new Survey(result[i]));
        }
        cb(null, svs);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get a survey by its opportunity ID and type ASYNC
 * @param {*} cfg 
 * @param {*} opportunity_id 
 * @param {*} survey_type 
 */
Survey.GetForOpportunityAndTypeAsync = function (cfg, opportunity_id, survey_type) {
    return new Promise((resolve, reject) => {
        Survey.GetForOpportunityAndType(cfg, opportunity_id, survey_type, (err, svs) => {
            if (err) {
                reject(err);
            } else {
                resolve(svs);
            }
        });
    });
};

/**
 * Delete all
 */
Survey.DeleteAll = function (cfg, cb) {
    cb = cb || function () { };
    dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE guid != NULL', function () {
        cb();
    }, function (err) {
        cb(err);
    });
};

/**
 * Make sure a survey exists for a particular opportunity and type
 */
Survey.EnforceSurveyExistsForOpportunityAndType = function (cfg, opportunity_id, survey_type, organization_id, cb) {
    const Orgn = require('../models/organization');
    Survey.GetForOpportunityAndType(cfg, opportunity_id, survey_type, (err, svs) => {
        if (err) {
            cb(err);
        } else {
            if (svs.length == 0) {
                Orgn.GetById(cfg, organization_id, (err, org) => {
                    if (err) {
                        cb(err);
                    } else {
                        Survey.Create(cfg, {
                            opportunity_id: opportunity_id,
                            organization_id: organization_id,
                            survey_type: survey_type,
                            theme: org.default_survey_template,
                            name: org.name + " Feedback",
                            survey_model: Buffer.from(JSON.stringify(Survey.getSurveyFixture(survey_type)))
                        }, (err, sv) => {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null, sv);
                            }
                        });
                    }
                });
            } else {
                cb(null, svs[0]);
            }
        }
    });
};

/**
 * Make sure a survey exists for a particular opportunity and type
 * @param {*} cfg
 * @param {*} opportunity_id
 * @param {*} survey_type
 * @param {*} organization_id
 */
Survey.EnforceSurveyExistsForOpportunityAndTypeAsync = function (cfg, opportunity_id, survey_type, organization_id) {
    return new Promise((resolve, reject) => {
        Survey.EnforceSurveyExistsForOpportunityAndType(cfg, opportunity_id, survey_type, organization_id, (err, sv) => {
            if (err) {
                reject(err);
            } else {
                resolve(sv);
            }
        });
    });
};

/**
 * Create a prospect
 */
Survey.Create = function (cfg, details, cb) {
    cb = cb || function () { };
    details = details || {};
    if (!details.opportunity_id) {
        throw new Error("Missing opportunity ID on Survey");
    }
    var _Defaults = {
        guid: shortid.generate(),
        name: "",
        organization_id: 0,
        theme: Survey.SURVEY_THEMES.LIGHT,
        created_at: new Date(),
        updated_at: new Date(),
        survey_type: Survey.SURVEY_TYPES.PROSPECT,
        survey_model: Buffer.from(JSON.stringify(Survey.getSurveyFixture(Survey.SURVEY_TYPES.PROSPECT)))
    };
    if (!(_Defaults.survey_model instanceof Buffer)) {
        _Defaults.survey_model = Buffer.from(JSON.stringify(_Defaults.survey_model));
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
    dbcmd
        .cmd(cfg.pool, query, params, function (result) {
            Survey
                .GetByGuid(cfg, _Defaults.guid, function (err, org) {
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
 * Create a prospect (ASYNC)
 */
Survey.CreateAsync = function (cfg, details) {
    return new Promise((resolve, reject) => {
        Survey.Create(cfg, details, (err, sv) => {
            if (err) {
                reject(err);
            } else {
                resolve(sv);
            }
        });
    });
};

/**
 * Get the default survey model
 */
Survey.GetDefaultSurveyModel = function () {
    return Survey.getSurveyFixture(Survey.SURVEY_TYPES.PROSPECT);
};

// Expose it
module.exports = Survey;