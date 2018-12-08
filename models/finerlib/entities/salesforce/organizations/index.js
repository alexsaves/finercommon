const x = require('throw-if-missing');

class SFOrganizations {
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
    getOrganizationById(id) {
        return this.conn.getConnection().sobject('Organization').retrieve([id]);
    }

     /**
     * Get all opportunities given a filter
     * @param {any} filters 
     * For a list of filters look at SF docs
     * @memberof SFOrganizations
     */
    getAll(filters) {
        let oppFilters = [];
        if (filters) {
            // Construct the expected filter format
            oppFilters = Object.keys(filters).reduce((obj, filterName) => Object.assign(obj, {
                [`Organization.${filterName}`]: filters[filterName] }), {});
        }
        return this.conn.getConnection().sobject('Organization')
            .find(oppFilters)
            .sort({ CreatedDate: -1, Name: 1 });
    }

}

module.exports = SFOrganizations;
