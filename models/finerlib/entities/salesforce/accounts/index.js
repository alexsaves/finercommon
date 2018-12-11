const x = require('throw-if-missing');

class SFAccounts {
    /**
     * Creates an instance of SFAccounts.
     * @param params
     * @param params.connection {SFConnection} the SFConnection instance
     * @constructor
     */
    constructor(
        {
            connection = x`connection`,
        }) {
        this.conn = connection;
    }

    /**
     * Gets a single account by id
     * @param {id}
     */
    getAccountById(id) {
        return this.conn.getConnection().sobject('Account').retrieve([id]);
    }

    /**
     * Get all opportunities given a filter
     * @param {any} filters 
     * For a list of filters look at SF docs
     * @memberof SFAccounts
     */
    getAll(filters) {
        // Construct the expected filter format
        let oppFilters = [];
        if (filters) {
            oppFilters = Object.keys(filters).reduce((obj, filterName) => Object.assign(obj, {
                [`Account.${filterName}`]: filters[filterName] }), {});
        }
        return this.conn.getConnection().sobject('Account')
            .find(oppFilters)
            .sort({ CreatedDate: -1, Name: 1 });
    }

    /**
     * Gets a single account given name
     * @param {name}
     */
    getAccountsByName(name) {
        return this.conn.getConnection().sobject('Account').find({ 'Account.Name': name });
    }

}

module.exports = SFAccounts;
