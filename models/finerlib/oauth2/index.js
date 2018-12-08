const x = require('throw-if-missing');
const providers = require('./../../../providers.json');
const SfAuth = require('./salesforce/auth.js');

class Oauth2Proxy {
    /**
     * A proxy class for oauth2
     * @param params {object} - { clientId, clientSecret, redirectUrl, provider},
     * @param params.clientId {string} the oauth2 clientid
     * @param params.clientSecret {string} the oauth2 client secret
     * @param params.provider {string} a provider that matches a key from providers.json
     * @returns {SFOauth2}
     * @memberof Oauth2
     */
    constructor(
        {
            clientId = x`clientId`,
            clientSecret = x`clientSecret`,
            redirectUrl = x`redirectUrl`,
            provider = x`provider`,
        }) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUrl = redirectUrl;
        this.provider = providers[provider];
        if (!this.provider) {
            throw new Error(`${provider} is not a valid provider`);
        }
        return this._getInstance();
    }

    _getInstance() {
        switch (this.provider) {
            case providers.salesforce:
                return new SfAuth({
                    clientId: this.clientId,
                    clientSecret: this.clientSecret,
                    redirectUri: this.redirectUrl,
                });
            default:
                throw new Error(`No valid handler found for provider ${this.provider}`);
        }
    }
}

module.exports = Oauth2Proxy;
