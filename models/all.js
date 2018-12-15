// Roll them all into one collection
var All = {
    Account: require('../models/account'),
    Approval: require('../models/approval'),
    Organization: require('../models/organization'),
    OrganizationAssociation: require('../models/organizationassociations'),
    OrganizationInvitation: require('../models/organizationinvitations'),
    Survey: require('../models/survey'),
    Respondent: require('../models/respondent'),
    Response: require('../models/response'),
    ResponseCollection: require('../models/responsecollection'),
    FileUploads: require('../models/fileuploads'),
    ResetPWInvitations: require('../models/resetpwinvitations'),
    CRMIntegrations: require('../models/crmintegrations'),
    CRMAccounts: require('../models/crmaccounts'),
    CRMContacts: require('../models/crmcontacts'),
    CRMOpportunityRoles: require('../models/crmopportunityroles'),
    CRMUsers: require('../models/crmusers'),
    CRMOrganizations: require('../models/crmorganizations'),
    CRMOpportunities: require('../models/crmopportunities'),
    PromoSignup: require('../models/promosignup'),
    CRMRoles: require('../models/crmroles'),
    Email: require('../models/email'),
    EmailUnsubscription: require('../models/emailunsubscription'),
    CRMIntegrationRules: require('../models/crmintegrationrules'),
    OrgReportCache: require('../models/orgreportcache'),
    BuyX: require('../models/buyx'),
    Daemon: require('../models/daemon'),
    Charts: require('../models/charts'),
    EmailChart: require('../models/emailchart'),
    // Clear out all the data. Foreign cascade should take care of the rest
    DeleteAllAsync: async function (cfg, logger) {
        logger("Deleting all...");
        await this
            .Account
            .DeleteAllAsync(cfg);
        logger("Deleted accounts.");

        await this
            .Organization
            .DeleteAllAsync(cfg);
        logger("Deleted organizations.");

        await this
            .OrganizationAssociation
            .DeleteAllAsync(cfg);
        logger("Deleted org assocs.");

        await this
            .OrganizationInvitation
            .DeleteAllAsync(cfg);
        logger("Deleted org invites.");
    },
    reports: {
        general: require('../models/reports/general'),
        openends: require('../models/reports/openends')
    }
};

// Expose it
module.exports = All;