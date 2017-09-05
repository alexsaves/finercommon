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
    }
};

// Expose it
module.exports = utils;