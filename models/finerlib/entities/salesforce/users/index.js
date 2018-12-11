const x = require('throw-if-missing');

class SFUsers {
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
    getuserById(id) {
        return this.conn.getConnection().sobject('User').retrieve([id]);
    }

     /**
     * Get all opportunities given a filter
     * @param {any} filters 
     * For a list of filters look at SF docs
     * @memberof SFUsers
     */
    getAll(filters) {
        let oppFilters = [];
        if (filters) {
            // Construct the expected filter format
            oppFilters = Object.keys(filters).reduce((obj, filterName) => Object.assign(obj, {
                [`User.${filterName}`]: filters[filterName] }), {});
        }
        return this.conn.getConnection().sobject('User')
            .find(oppFilters)
            .sort({ CreatedDate: -1, Name: 1 });
    }

}

module.exports = SFUsers;
