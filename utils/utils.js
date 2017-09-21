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
<<<<<<< HEAD
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
    },

    /**
     * Create insert query given an array of data to be inserted
     * ArrObj
     * InsertDescription
     */
    createInsertStatementGivenData: function(dbName, tableName, dataArr, rowDict, extraFields){
        let query = `INSERT INTO ${dbName}.${tableName} (`;
        let rowNames = rowDict.map((d) => d.row_name);
        let extraValues = [];
        if(extraFields.length > 0) {
            for(let i=0; i< extraFields.length; i++) {
                rowNames.push(extraFields[i].name);
                extraValues.push(`'${extraFields[i].value}'`);
            }
        }
        query = query + rowNames.join(', ') + ') VALUES ';
        dataArr.map((data, index) => {
            let valueSet = [];
            for(let i=0; i<rowDict.length; i++) {
                let desc = rowDict[i];
                if(data[desc.name]) {
                    valueSet.push(`'${data[desc.name]}'`);
                } else {
                    valueSet.push('NULL');
                }
            }
            query = query + '(' + valueSet.join(', ') + (extraFields.length > 0 ? ', ' + extraValues.join(', ') + ')' : '') + (index === dataArr.length-1 ? ';' : ',');
        });
        return query;
=======
>>>>>>> origin/master
    }
};


// Expose it
module.exports = utils;