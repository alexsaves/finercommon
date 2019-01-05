const utils = require('../utils/utils');
const bityProm = require('bity-promise');

/**
 * Holds a bunch of responses
 * @param {Array[Response]} resps (Optional)
 */
var ResponseCollection = function (resps) {
    this.responses = [];
    if (resps) {
        this.addResponses(resps);
    }
};

/**
 * Add one or more responses
 */
ResponseCollection.prototype.addResponses = function (responses) {
    if (responses) {
        if (responses instanceof Array) {
            for (let i = 0; i < responses.length; i++) {
                this
                    .responses
                    .push(responses[i]);
            }
        } else {
            this
                .responses
                .push(responses);
        }
    }
};

/**
 * Get the first response matching the criteria
 */
ResponseCollection.prototype.getAllMatching = function (opts) {
    opts = opts || {};
    let optkeys = Object.keys(opts);
    var resultCollection = new ResponseCollection();
    for (let i = 0; i < this.responses.length; i++) {
        let resp = this.responses[i],
            didpass = true;
        for (let k = 0; k < optkeys.length; k++) {
            if (resp[optkeys[k]] != opts[optkeys[k]]) {
                didpass = false;
                break;
            }
        }
        if (didpass) {
            resultCollection.addResponses(resp);
        }
    }
    return resultCollection;
};

/**
 * Get an element from the survey
 */
ResponseCollection.prototype.getElementFromSurvey = function (survey, name) {
    let mdl = survey.survey_model;
    for (let i = 0; i < mdl.pages.length; i++) {
        var elm = mdl
            .pages[i]
            .elements
            .find((el) => {
                return el.name == name;
            });
        if (elm) {
            return elm;
        }
    }
    return false;
};

/**
 * Add new answers to an existing collection
 */
ResponseCollection.prototype.integrateNewAnswers = function (cfg, survey, data, respondent) {
    if (!data || !data.answers) {
        return;
    }
    let okeys = Object.keys(data.answers);
    if (okeys.length == 0) {
        return;
    }
    let Response = require('../models/response');
    for (let i = 0; i < okeys.length; i++) {
        let name = okeys[i],
            question = this.getElementFromSurvey(survey, name),
            answer = data.answers[name];

        if (!question) {
            throw new Error("Could not find question " + name + " in that survey model.");
        } else {
            var existingResp = this
                .responses
                .find((el) => {
                    return el.name == name;
                });
            if (!existingResp) {
                existingResp = new Response({
                    name: name,
                    respondent_id: respondent.id,
                    survey_guid: survey.guid,
                    is_active: 1,
                    created_at: new Date(),
                    updated_at: new Date()
                });
                this.addResponses(existingResp);
            }
            existingResp.updateWithResponse(answer, question);
        }
    }
};

/**
 * Save to the DB
 */
ResponseCollection.prototype.commit = function (cfg, cb) {
    cb = cb || function () {};
    let interestingOnes = this
        .responses
        .filter((el) => {
            return el._state == 0 || el._state == 2;
        });
    if (interestingOnes.length == 0) {
        process.nextTick(cb);
    } else {
        var prom = new bityProm(() => {
            // success
            cb(null);
        }, () => {
            // fail
            cb({message: "Failed to save responses"});
        }, 1000000);
        for (let k = 0; k < interestingOnes.length; k++) {
            prom.make("_" + k);
        }
        for (let k = 0; k < interestingOnes.length; k++) {
            // Do the work
            interestingOnes[k]
                .commit(cfg, function (which) {
                    return function (err) {
                        if (err) {
                            prom.break("_" + which);
                        } else {
                            prom.resolve("_" + which);
                        }
                    };
                }(k));
        }
    }
};

// Expose it
module.exports = ResponseCollection;