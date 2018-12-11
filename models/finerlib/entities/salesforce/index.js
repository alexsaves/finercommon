const x = require('throw-if-missing');
const Opportunities = require('./opportunities');
const Accounts = require('./accounts');
const Contacts = require('./contacts');
const Users = require('./users');
const Organizations = require('./organizations');
const Roles = require('./roles');
const EntitiesSync = require('./entities-sync');

class SFEntities {
    /**
     * Creates an instance of SFEntities.
     * @param params
     * @param params.connection {SFConnection} the SFConnection instance
     * @constructor
     */
    constructor(
        {
            connection = x`connection`,
        }) {
        this.conn = connection;
        this.opportunities = new Opportunities({ connection });
        this.accounts = new Accounts({ connection });
        this.contacts = new Contacts({ connection });
        this.users = new Users({ connection });
        this.organizations = new Organizations({ connection });
        this.roles = new Roles({ connection });
        this.entitiesSync = new EntitiesSync({ connection });
    }
}

module.exports = SFEntities;
