/**
 * Some helper stuff
 */
var utils = {
    /**
     * Auto-trim strings if necessary, based on length
     */
    enforceStringLength: function (str, len) {
        str = str || '';
        if (str.length > len) {
            str = str.substr(0, len);
        }
        return str;
    },

    /**
     * Is this question name for an "other"
     */
    isOtherLabel: function (label) {
        if (label.length > ("-Comment".length) && label.indexOf('-Comment') > -1) {
            return true;
        } else {
            return false;
        }
    },

    /**
     * Create insert query given an array of data to be inserted
     * @param {*} dbName 
     * @param {*} tableName 
     * @param {*} dataArr 
     * @param {*} rowDict 
     * @param {*} extraFields 
     */
    createInsertStatementGivenData: function (dbName, tableName, dataArr, rowDict, extraFields) {
        let query = `INSERT INTO ${dbName}.${tableName} (`;
        let rowNames = rowDict.map((d) => d.row_name);
        let extraValues = [];
        if (extraFields.length > 0) {
            for (let i = 0; i < extraFields.length; i++) {
                rowNames.push(extraFields[i].name);
                extraValues.push(`'${extraFields[i].value}'`);
            }
        }
        query = query + rowNames.join(', ') + ') VALUES ';
        dataArr.map((data, index) => {
            let valueSet = [];
            for (let i = 0; i < rowDict.length; i++) {
                let desc = rowDict[i];
                if (data[desc.name]) {
                    valueSet.push(`'${data[desc.name]}'`);
                } else {
                    valueSet.push('NULL');
                }
            }
            query = query + '(' + valueSet.join(', ') + (extraFields.length > 0
                ? ', ' + extraValues.join(', ') + ')'
                : ')') + (index === dataArr.length - 1
                    ? ';'
                    : ',');
        });
        return query;
    },

    /**
     * Create insert query given an array of data to be inserted
     * @param {*} dbName 
     * @param {*} tableName 
     * @param {*} dataArr 
     * @param {*} rowDict 
     * @param {*} extraFields 
     * @param {*} uniqueKeyName 
     */
    createInsertOrUpdateStatementGivenData: function (dbName, tableName, dataArr, rowDict, extraFields, uniqueKeyName) {
        //console.log("createInsertOrUpdateStatementGivenData", arguments);
        let query = `INSERT INTO ${dbName}.${tableName} (`;
        let rowNames = rowDict.map((d) => d.row_name);
        let extraValues = [];
        if (extraFields.length > 0) {
            for (let i = 0; i < extraFields.length; i++) {
                rowNames.push(extraFields[i].name);
                extraValues.push(`'${extraFields[i].value}'`);
            }
        }
        query = query + rowNames.join(', ') + ') VALUES ';

        const dupQuery = ' ON DUPLICATE KEY UPDATE';
        let params = [];
        dataArr.map((data, index) => {
            let valueSet = [];
            for (let i = 0; i < rowDict.length; i++) {
                let desc = rowDict[i];
                if (data[desc.name]) {
                    valueSet.push(`${data[desc.name]}`);
                } else {
                    valueSet.push(null);
                }
            }
            params = params
                .concat(valueSet)
                .concat(extraFields.map(e => e.value));
            // TODO: add extra values
            query = query + '(' + valueSet
                .map(v => '?')
                .join(', ') + (extraFields.length > 0
                    ? ', ' + extraValues.map(e => '?').join(', ') + ')'
                    : ')') + (index === dataArr.length - 1
                        ? ``
                        : ',');
        });

        const valueSets = [];
        rowNames.forEach((rowName) => {
            if (rowName !== uniqueKeyName) {
                valueSets.push(`${rowName}=Values(${rowName})`);
            }
        });

        query += `${dupQuery} ${valueSets.join(', ')}`;

        return { query, params };
    }
};

// Expose it
module.exports = utils;