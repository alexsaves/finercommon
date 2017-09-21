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
<<<<<<< HEAD
    CRMAccounts: require('../models/crmaccounts'),
    CRMUsers: require('../models/crmusers'),
    CRMOrganizations: require('../models/crmorganizations'),
    CRMRoles: require('../models/crmroles'),
    Email: require('../models/email')
=======
    Email: require('../models/email'),
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
>>>>>>> origin/master
};

// Expose it
module.exports = All;