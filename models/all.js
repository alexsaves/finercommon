// Roll them all into one collection
var All = {
    Account: require('../models/account'),
    Organization: require('../models/organization'),
    OrganizationAssociation: require('../models/organizationassociations'),
    Prospect: require('../models/prospect'),
    Survey: require('../models/survey'),
    Respondent: require('../models/respondent'),
    Response: require('../models/response'),
    ResponseCollection: require('../models/responsecollection'),
    FileUploads: require('../models/fileuploads')
};

// Expose it
module.exports = All;