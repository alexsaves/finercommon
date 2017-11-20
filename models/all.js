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
    CRMUsers: require('../models/crmusers'),
    CRMOrganizations: require('../models/crmorganizations'),
    CRMOpportunities: require('../models/crmopportunities'),
    CRMRoles: require('../models/crmroles'),
    Email: require('../models/email'),
    CRMIntegrationRules: require('../models/crmintegrationrules'),
    // TODO: update delete to include CRM entities
    DeleteAll: function (cfg, cb) {
        console.log("Deleting all...");
        this
            .Account
            .DeleteAll(cfg, (err) => {
                if (err) {
                    cb(err);
                } else {
                    console.log("Deleted accounts.");
                    this
                        .Organization
                        .DeleteAll(cfg, (err) => {
                            if (err) {
                                cb(err);
                            } else {
                                console.log("Deleted organizations.");
                                this
                                    .OrganizationAssociation
                                    .DeleteAll(cfg, (err) => {
                                        if (err) {
                                            cb(err);
                                        } else {
                                            console.log("Deleted org assocs.");
                                            this
                                                .OrganizationInvitation
                                                .DeleteAll(cfg, (err) => {
                                                    if (err) {
                                                        cb(err);
                                                    } else {
                                                        console.log("Deleted org invites.");
                                                        this
                                                            .Prospect
                                                            .DeleteAll(cfg, (err) => {
                                                                if (err) {
                                                                    cb(err);
                                                                } else {
                                                                    console.log("Deleted prospects.");
                                                                    this
                                                                        .Survey
                                                                        .DeleteAll(cfg, (err) => {
                                                                            if (err) {
                                                                                cb(err);
                                                                            } else {
                                                                                console.log("Deleted surveys.");
                                                                                this
                                                                                    .Respondent
                                                                                    .DeleteAll(cfg, (err) => {
                                                                                        if (err) {
                                                                                            cb(err);
                                                                                        } else {
                                                                                            console.log("Deleted respondents.");
                                                                                            this
                                                                                                .Response
                                                                                                .DeleteAll(cfg, (err) => {
                                                                                                    if (err) {
                                                                                                        cb(err);
                                                                                                    } else {
                                                                                                        console.log("Deleted responses.");
                                                                                                        this
                                                                                                            .FileUploads
                                                                                                            .DeleteAll(cfg, (err) => {
                                                                                                                if (err) {
                                                                                                                    cb(err);
                                                                                                                } else {
                                                                                                                    console.log("Deleted file uploads.");
                                                                                                                    this
                                                                                                                        .ResetPWInvitations
                                                                                                                        .DeleteAll(cfg, (err) => {
                                                                                                                            if (err) {
                                                                                                                                cb(err);
                                                                                                                            } else {
                                                                                                                                console.log("Deleted reset password invites.");
                                                                                                                                this
                                                                                                                                    .CRMIntegrations
                                                                                                                                    .DeleteAll(cfg, (err) => {
                                                                                                                                        if (err) {
                                                                                                                                            cb(err);
                                                                                                                                        } else {
                                                                                                                                            console.log("Deleted CRM integrations.");
                                                                                                                                            cb();
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                            }
                                                                                                                        });
                                                                                                                }
                                                                                                            });
                                                                                                    }
                                                                                                });
                                                                                        }
                                                                                    })
                                                                            }
                                                                        });
                                                                }
                                                            })
                                                    }
                                                })
                                        }
                                    })
                            }
                        });
                }
            })
    }
};

// Expose it
module.exports = All;