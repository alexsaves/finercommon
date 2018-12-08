const { OAuth2 } = require('jsforce');
const x = require('throw-if-missing');

class SFOauth2 {
    /**
     * Creates an instance of SFOauth2.
     * @param params {object} - { clientId, clientSecret, redirectUri }
     * @param params.clientId {string} oAuth2 clientid
     * @param params.clientSecret {string} oAuth2 clientSecret
     * @param params.redirectUri {string} the callback uri
     */
    constructor({
        clientId = x`clientId`,
        clientSecret = x`clientSecret`,
        redirectUri = x`redirectUri`,
    }) {
        this.oauth2 = new OAuth2({
            clientId,
            clientSecret,
            redirectUri,
        });
    }

    /**
     * Gets the authorization url
     * @returns {string} authorization url
     */
    getAuthUrl() {
        return this.oauth2.getAuthorizationUrl();
    }

    /**
     * Request an accessToken
     * This method requires either authToken or refreshToken to be passed in
     * authToken should be used only the first time the user authenticates and gives our application permissions, the refresh token is usually stored for future calls
     * @param params {object} { authToken, refreshToken }
     * @param params.authToken {string} oAuth2 authtoken
     * @param params.refreshToken {string} oAuth2 refresh token
     * @returns {string} access token
     */
    requestAccessToken({ authToken, refreshToken }) {
        if (refreshToken) {
            return this.oauth2.refreshToken(refreshToken);
        } else if (authToken) {
            return this.oauth2.requestToken(authToken);
        }
        throw new Error('Either authToken or requestToken needs to be passed in');
    }
}
module.exports = SFOauth2;
