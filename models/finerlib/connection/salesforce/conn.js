const { Connection } = require('jsforce');
const x = require('throw-if-missing');

class SFConnection {
    /**
     * Creates an instance of SFConnection.
     * @param params
     * @param params.instanceUrl {string} the instanceUrl
     * @param params.accessToken {string} the oauth accessToken
     * @constructor
     */
    constructor(
        {
            instanceUrl = x`instanceUrl`,
            accessToken = x`accessToken`,
        }) {
        this.conn = new Connection({
            instanceUrl,
            accessToken,
        });

        this.conn.on('refresh', (at) => {
            this.accesToken = at;
        });
    }

    /**
     * Gets the connection attribute
     * @returns {instance} jsforce connection instance
     */
    getConnection() {
        return this.conn;
    }
}

module.exports = SFConnection;
