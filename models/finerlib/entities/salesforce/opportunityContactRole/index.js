const x = require('throw-if-missing');
const jsforce = require('jsforce');

class SFOpportunityContactRole {
    /**
     * Creates an instance of SFOpportunityContactRole.
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
     * Gets a single opportunity
     * @param {id}
     */
    getOpportunity(id) {
        return this.conn.getConnection().sobject('OpportunityContactRole').retrieve([id]);
    }
    
    /**
     * Get all OpportunityContactRoles given a filter
     * @param {any} filters 
     * For a list of filters look at SF docs
     * @memberof SFOpportunityContactRole
     */
    getAll(filters) {
        // Construct the expected filter format
        let oppFilters = [];
        if (filters) {
            oppFilters = Object.keys(filters).reduce((obj, filterName) => Object.assign(obj, {
                [`OpportunityContactRole.${filterName}`]: filters[filterName] }), {});
        }
        return this.conn.getConnection().sobject('OpportunityContactRole')
            .find(oppFilters)
    }
}

module.exports = SFOpportunityContactRole;
