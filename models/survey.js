const dbcmd = require('../utils/dbcommand'),
    utils = require('../utils/utils'),
    md5 = require('md5'),
    extend = require('extend'),
    tablename = 'surveys',
    shortid = require('shortid'),
    check = require('check-types'),
    utf8 = require('utf8'),
    fs = require('fs');

// Fixtures
var survey_fixture = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/surveys/questionnaire.json').toString('utf-8'));

/**
 * The survey class
 */
var Survey = function(details) {
    extend(this, details || {});
};

/**
 * Save this instance of a survey to the DB
 */
Survey.prototype.commit = function(cfg, cb) {
    cb = cb || function() {};
    if (check.string(this.survey_model)) {
        this.survey_model = new Buffer(this.survey_model);
    }
    var update = dbcmd.constructUpdate(this, tablename, cfg.db.db, "guid", this.guid);
    dbcmd.cmd(cfg.pool, update.query, update.params, function(result) {
        cb(null, this);
    }, function(err) {
        cb(err);
    });
};

/**
 * Get a question object by its id
 */
Survey.prototype.getQuestionById = function(id) {
    if (this.survey_model) {
        var pgs = this.survey_model.pages;
        var _id = id + '';
        if (utils.isOtherLabel(_id)) {
            _id = _id.split('-Comment')[0];
        }
        for (let i = 0; i < pgs.length; i++) {
            let pg = pgs[i],
                qs = pg.questions;
            for (let k = 0; k < qs.length; k++) {
                let q = qs[k];
                if (q.name == _id) {
                    return q;
                }
            }
        }
    }
    return;
};

/**
 * Create a new respondent with the data
 */
Survey.prototype.saveRespondent = function(cfg, respondent, data, cb) {
    if (arguments.length > 4) {
        throw new Error("saveRespondent: missing some arguments.");
    } else {
        respondent.applyAnswersForSurvey(cfg, this, data, cb);
    }
};

/**
 * Apply the default fixture (you still need to commit this)
 */
Survey.prototype.applyDefaultSurveyFixture = function() {
    this.survey_model = JSON.stringify(survey_fixture);
};

/**
 * Get a survey by its guid
 */
Survey.GetByGuid = function(cfg, guid, cb) {
    cb = cb || function() {};
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE guid = ?', [guid], function(result) {
        cb(result.length === 0 ? { message: "No user found." } : null, result.length > 0 ? new Survey(result[0]) : null);
    }, function(err) {
        cb(err);
    });
};

/**
 * Create a prospect
 */
Survey.Create = function(cfg, details, cb) {
    cb = cb || function() {};
    details = details || {};
    var _Defaults = {
        guid: shortid.generate(),
        name: "",
        organization_id: 0,
        prospect_id: 0,
        created_at: new Date(),
        updated_at: new Date(),
        survey_model: new Buffer(JSON.stringify({
            pages: [{
                name: "page1",
                questions: [{
                        type: "comment",
                        name: "general1",
                        placeHolder: "right here",
                        title: "Give us your opinion please!"
                    },
                    {
                        type: "radiogroup",
                        choices: [{
                                value: "1",
                                text: "first item"
                            },
                            {
                                value: "2",
                                text: "second item"
                            },
                            {
                                value: "3",
                                text: "third item"
                            }
                        ],
                        name: "question1",
                        title: "sdlkjg ldfkjg ldfkjgssldfk gjldkfj glkdfjs glkj d"
                    }
                ]
            }]
        }))
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
        Survey.GetByGuid(cfg, _Defaults.guid, function(err, org) {
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

/**
 * Get the default survey model
 */
Survey.GetDefaultSurveyModel = function() {
    return survey_fixture;
};

// Expose it
module.exports = Survey;