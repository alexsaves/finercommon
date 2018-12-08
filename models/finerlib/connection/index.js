const x = require('throw-if-missing');
const providers = require('./../../../providers.json');
const SfConnection = require('./salesforce/conn.js');

class ConnectionProxy {
    /**
     * This proxy class decides which class to instantiate based on the provider
     * @param params {object}
     * @param params.accessToken {string} oAuth access token
     * @param params.instanceUrl {string} instance url
     * @param params.provider {string} provider that matches a key in providers.json
     * @returns {SFConnection} - The instance of a respective connection provider
     */
    constructor(
        {
            accessToken = x`accessToken`,
            instanceUrl = x`instanceUrl`,
            provider = x`provider`,
        }) {
        this.accessToken = accessToken;
        this.instanceUrl = instanceUrl;
        this.provider = providers[provider];
        if (!this.provider) {
            throw new Error(`${provider} is not a valid provider`);
        }
        return this._getInstance();
    }
    _getInstance() {
        switch (this.provider) {
            case providers.salesforce:
                return new SfConnection({
                    accessToken: this.accessToken,
                    instanceUrl: this.instanceUrl,
                });
            default:
                throw new Error(`No valid handler found for provider ${this.provider}`);
        }
    }
}

module.exports = ConnectionProxy;