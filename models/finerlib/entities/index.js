const x = require('throw-if-missing');
const providers = require('./../../../providers.json');
const SFEntities = require('./salesforce');

class EntitiesProxy {
    /**
     * This proxy class decides which entity class to instantiate based on the provider
     * @param params {object}
     * @param params.provider {string} provider that matches a key in providers.json
     * @returns {SFConnection} - The instance of a respective connection provider
     */
    constructor(
        {
            connection = x`connection`,
            provider = x`provider`,
        }) {
        this.connection = connection;
        this.provider = providers[provider];
        if (!this.provider) {
            throw new Error(`${provider} is not a valid provider`);
        }
        return this._getInstance();
    }
    _getInstance() {
        switch (this.provider) {
            case providers.salesforce:
                return new SFEntities({
                    connection: this.connection,
                });
            default:
                throw new Error(`No valid handler found for provider ${this.provider}`);
        }
    }
}

module.exports = EntitiesProxy;