/**
 * Some helper stuff
 */
var utils = {
    /**
     * Auto-trim strings if necessary, based on length
     */
    enforceStringLength: function(str, len) {
        str = str || '';
        if (str.length > len) {
            str = str.substr(0, len);
        }
        return str;
    },

    /**
     * Is this question name for an "other"
     */
    isOtherLabel: function(label) {
        if (label.length > ("-Comment".length) && label.indexOf('-Comment') > -1) {
            return true;
        } else {
            return false;
        }
    }
};

// Expose it
module.exports = utils;