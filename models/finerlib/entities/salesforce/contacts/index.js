const x = require('throw-if-missing');

class SFContacts {
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
    getContactById(id) {
        return this.conn.getConnection().sobject('Contact').retrieve([id]);
    }

     /**
     * Get all opportunities given a filter
     * @param {any} filters 
     * For a list of filters look at SF docs
     * @memberof SFContacts
     */
    getAll(filters) {
        // Construct the expected filter format
        let oppFilters = [];
        if (filters) {
            oppFilters = Object.keys(filters).reduce((obj, filterName) => Object.assign(obj, {
                [`Contact.${filterName}`]: filters[filterName] }), {});
        }
        return this.conn.getConnection().sobject('Contact')
            .find(oppFilters)
            .sort({ CreatedDate: -1, Name: 1 });
    }

    /**
     * Gets all contacts associated with an account
     * @param {accountId}
     */
    getContactsAssociatedWithAccount(accountId) {
        return this.conn.getConnection().sobject('Contact').find({ 'Account.Id': accountId });
    }

}

module.exports = SFContacts;
