// Roll them all into one collection
var All = {
    Account: require('../models/account'),
    Organization: require('../models/organization'),
    OrganizationAssociation: require('../models/organizationassociations'),
    OrganizationInvitation: require('../models/organizationinvitations'),
    Prospect: require('../models/prospect'),
    Survey: require('../models/survey'),
    Respondent: require('../models/respondent'),
    Response: require('../models/response'),
    ResponseCollection: require('../models/responsecollection'),
    FileUploads: require('../models/fileuploads'),
    ResetPWInvitations: require('../models/resetpwinvitations'),
    CRMIntegrations: require('../models/crmintegrations'),
    CRMAccounts: require('../models/crmaccounts'),
    CRMUsers: require('../models/crmusers'),
    CRMOrganizations: require('../models/crmorganizations'),
    CRMRoles: require('../models/crmroles'),
    Email: require('../models/email')
};

// Expose it
module.exports = All;