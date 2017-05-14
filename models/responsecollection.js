const utils = require('../utils/utils');

/**
 * Holds a bunch of responses
 * @param {Array[Response]} resps (Optional)
 */
var ResponseCollection = function(resps) {
    this.addResponses(resps);
};

/**
 * Holds the actual responses
 */
ResponseCollection.prototype.responses = [];

/**
 * Add one or more responses
 */
ResponseCollection.prototype.addResponses = function(responses) {
    if (responses) {
        if (responses instanceof Array) {
            for (let i = 0; i < responses.length; i++) {
                this.responses.push(responses[i]);
            }
        } else {
            this.responses.push(responses);
        }
    }
};

/**
 * Get the first response matching the criteria
 */
ResponseCollection.prototype.getFirstMatching = function(opts) {
    opts = opts || {};
    if (opts.q_id && utils.isOtherLabel(opts.q_id)) {
        opts.q_id = opts.q_id.split('-Comment')[0];
    }
    let optkeys = Object.keys(opts);
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
            return resp;
        }
    }
    return null;
};

// Expose it
module.exports = ResponseCollection;