const x = require('throw-if-missing');
const jsforce = require('jsforce');

class SFOpportunities {
    /**
     * Creates an instance of SFOpportunities.
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
        return this.conn.getConnection().sobject('Opportunity').retrieve([id]);
    }
    
    /**
     * Get all opportunities given a filter
     * @param {any} filters 
     * For a list of filters look at SF docs
     * @memberof SFOpportunities
     */
    getAll(filters) {
        // Construct the expected filter format
        let oppFilters = [];
        if (filters) {
            oppFilters = Object.keys(filters).reduce((obj, filterName) => Object.assign(obj, {
                [`Opportunity.${filterName}`]: filters[filterName] }), {});
        }
        oppFilters.LastModifiedDate = jsforce.Date.LAST_90_DAYS;
        return this.conn.getConnection().sobject('Opportunity')
            .find(oppFilters)
            .sort({ CreatedDate: -1, Name: 1 });
    }

    /**
     * Gets a list of all closed lost opportunities
     * @param {connection}
     */
    getAllClosedLostOpportunities() {
        return this.conn.getConnection().sobject('Opportunity')
            .find({
                'Opportunity.IsClosed': false,
                'Opportunity.IsWon': false,
            })
            .sort({ CreatedDate: -1, Name: 1 });
    }

    /**
     * Gets a list of all closed won opportunities
     * @param {connection}
     */
    getAllClosedWonOpportunities() {
        return this.conn.getConnection().sobject('Opportunity')
            .find({
                'Opportunity.IsClosed': false,
                'Opportunity.IsWon': true,
            })
            .sort({ CreatedDate: -1, Name: 1 });
    }
}

module.exports = SFOpportunities;
