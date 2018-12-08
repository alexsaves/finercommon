const x = require('throw-if-missing');

class SFRoles {
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
    getRoleById(id) {
        return this.conn.getConnection().sobject('UserRole').retrieve([id]);
    }

     /**
     * Get all opportunities given a filter
     * @param {any} filters 
     * For a list of filters look at SF docs
     * @memberof SFRoles
     */
    getAll(filters) {
        let oppFilters = [];
        if (filters) {
            // Construct the expected filter format
            oppFilters = Object.keys(filters).reduce((obj, filterName) => Object.assign(obj, {
                [`UserRole.${filterName}`]: filters[filterName] }), {});
        }
        return this.conn.getConnection().sobject('UserRole')
            .find(oppFilters)
            .sort({ Name: 1 });
    }

}

module.exports = SFRoles;
