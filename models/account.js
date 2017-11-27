const dbcmd = require('../utils/dbcommand'),
    md5 = require('md5'),
    extend = require('extend'),
    tablename = 'accounts',
    btoa = require('btoa'),
    Organization = require('../models/organization'),
    Survey = require('../models/survey'),
    Email = require('../models/email'),
    CRMIntegrations = require('../models/crmintegrations');

/**
 * The account class
 */
var Account = function (details) {
    extend(this, details || {});
    if (!this.profile_image_uid) {
        this.profile_image_uid = 'blankprofile';
    }
    if (this.emailverified === 0) {
        this.emailverified = false;
    } else if (this.emailverified === 1) {
        this.emailverified = true;
    }
};

/**
 * Set a new password
 */
Account.prototype.setNewPassword = function (cfg, pw, cb) {
    dbcmd
        .cmd(cfg.pool, 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET pw_md5 = ?, updated_at = ? WHERE id = ?', [
            md5(pw), new Date(), this.id
        ], function (result) {
            cb(null, this);
        }.bind(this), function (err) {
            cb(err);
        });
};

/**
 * Validate a secure token
 * @param {String} securetoken 
 */
Account.prototype.validationSecureIsValid = function(securetoken) {
    if (securetoken && securetoken == md5(this.email + this.id + "_f437")) {
        return true;
    }
    return false;
};

/**
 * Send out a validation email
 * @param {*} cfg 
 * @param {*} cb 
 */
Account.prototype.sendValidationEmail = function(cfg, cb) {
    // Invite updated! Send an updated email
    let emailCtrl = new Email(cfg.email.server, cfg.email.port, cfg.email.key, cfg.email.secret);
    emailCtrl.send(cfg, 0, cfg.email.defaultFrom, this.email, 'validateemail', 'Validate your FinerInk account.', {
      account: this,
      validateurl: cfg.portalUrl + "/checkvalidate/?id=" + encodeURIComponent(this.id) + "&secure=" + encodeURIComponent(md5(this.email + this.id + "_f437"))
    }, function (err) {
      if (err) {
        console.log("Error sending validation email", err);
        cb("Error sending validation email");
      } else {
        // Success
        cb(null);
      }
    });
}

/**
 * Save any changes to the DB row
 */
Account.prototype.commit = function (cfg, cb) {
    cb = cb || function () {};
    var excludes = [
            'id', 'created_at'
        ],
        valKeys = Object.keys(this),
        query = 'UPDATE ' + cfg.db.db + '.' + tablename + ' SET ',
        params = [],
        count = 0;
    this.updated_at = new Date();
    for (var elm in valKeys) {
        if (excludes.indexOf(valKeys[elm]) == -1) {
            if (count > 0) {
                query += ', ';
            }
            query += valKeys[elm] + ' = ?';
            if (valKeys[elm] == "emailverified") {
                if (this[valKeys[elm]] === true) {
                    params.push(1);
                } else if (this[valKeys[elm]] === false) {
                    params.push(0);
                } else {
                    params.push(this[valKeys[elm]]);
                }
            } else {
                params.push(this[valKeys[elm]]);
            }
            count++;
        }
    }
    query += ' WHERE id = ?';
    params.push(this.id);

    dbcmd.cmd(cfg.pool, query, params, function (result) {
        cb(null, this);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get the level of access for this oreg
 * 0 = owner, 1 = admin, 2 = user, -1 = none
 */
Account.prototype.getAccessLevelForOrganization = function (cfg, orgid, cb) {
    this.getOrganizations(cfg, (err, orgs) => {
        if (err) {
            cb(err);
        } else {
            var theorg = orgs.find((val) => {
                return val.id == orgid;
            });
            if (theorg) {
                cb(null, theorg.association.assoc_type);
            } else {
                cb(null, -1);
            }
        }
    });
};

/**
 * Get a list of the organizations for this user
 */
Account.prototype.hasAccessToSurvey = function (cfg, guid, cb) {
    Organization.GetForAccount(cfg, this.id, (err, orgs) => {
        if (err) {
            cb(err);
        } else {
            Survey.GetForOrganizations(cfg, orgs, (err2, svs) => {
                if (err2) {
                    cb(err2);
                } else {
                    if (svs.find((val) => {
                        return val.guid === guid;
                    })) {
                        cb(null, true);
                    } else {
                        cb(null, false);
                    }
                }
            });
        }
    });
};

/**
 * Get a list of the organizations for this user
 */
Account.prototype.getOrganizations = function (cfg, cb) {
    Organization.GetForAccount(cfg, this.id, cb);
};

/**
 * Get the complete list of eligible integrations for this user
 */
Account.prototype.getIntegrations = function (cfg, cb) {
    this
        .getOrganizations(cfg, function (err, orgs) {
            if (err) {
                cb(err);
            } else {
                CRMIntegrations.GetForOrgs(cfg, orgs, cb);
            }
        });
};

/**
 * Get an account by its email and password
 */
Account.GetByEmailAndPassword = function (cfg, e, p, cb) {
    cb = cb || function () {};
    p = md5(p || '');

    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ? AND pw_md5 = ?', [
        e, p
    ], function (result) {
        cb(result.length === 0
            ? {
                message: "No user found."
            }
            : null, result.length > 0
            ? new Account(result[0])
            : null);
    }, function (err) {
        cb(err);
    });
};

/**
 * Retrieve an account by its Facebook ID
 * @param {*} cfg
 * @param {*} fbId
 * @param {*} cb
 */
Account.GetAccountByFbid = (cfg, fbId, cb) => {
    cb = cb || function () {};

    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE fbid = ? LIMIT 1', [fbId], function (result) {
        cb(result.length === 0
            ? {
                message: "No user found."
            }
            : null, result.length > 0
            ? new Account(result[0])
            : null);
    }, function (err) {
        cb(err);
    });
}

/**
 * Either return the account or create one if one does not exist
 */
Account.FindOrCreate = (cfg, opts) => {
    if (opts.fbId) {}
}

/**
 * Get an account by its email
 */
Account.GetByEmail = function (cfg, e, cb) {
    cb = cb || function () {};

    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ? LIMIT 1', [e], function (result) {
        cb(result.length === 0
            ? {
                userMissing: true,
                message: "No user found."
            }
            : null, result.length > 0
            ? new Account(result[0])
            : null);
    }, function (err) {
        cb(err);
    });
};

/**
 * Get an account by its id
 */
Account.GetById = function (cfg, id, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
        cb(result.length === 0
            ? {
                message: "No user found."
            }
            : null, result.length > 0
            ? new Account(result[0])
            : null);
    }, function (err) {
        cb(err);
    });
};

/**
 * Delete all
 */
Account.DeleteAll = function (cfg, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id > 0', function () {
        cb();
    }, function (err) {
        cb(err);
    });
};

/**
 * Create a user
 */
Account.Create = function (cfg, details, cb) {
    cb = cb || function () {};
    details = details || {};
    var _Defaults = {
        name: "",
        created_at: new Date(),
        updated_at: new Date(),
        email: "",
        pw_md5: md5(''),
        emailverified: false
    };
    if (details.password) {
        details.pw_md5 = md5(details.password);
        delete details.password;
    }
    extend(_Defaults, details);
    if (_Defaults.emailverified === false) {
        _Defaults.emailverified = 0;
    }
    if (_Defaults.emailverified === true) {
        _Defaults.emailverified = 1;
    }
    var valKeys = Object.keys(_Defaults),
        query = 'INSERT INTO ' + cfg.db.db + '.' + tablename + ' SET ',
        params = [],
        count = 0;
    for (var elm in valKeys) {
        if (count > 0) {
            query += ', ';
        }
        query += valKeys[elm] + ' = ?';
        params.push(_Defaults[valKeys[elm]]);
        count++;
    }
    dbcmd
        .cmd(cfg.pool, query, params, function (result) {
            Account
                .GetById(cfg, result.insertId, function (err, user) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, user);
                    }
                });
        }, function (err) {
            cb(err);
        });
};

// Expose it
module.exports = Account;