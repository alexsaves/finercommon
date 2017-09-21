const dbcmd = require('../utils/dbcommand'),
    md5 = require('md5'),
    extend = require('extend'),
    tablename = 'accounts',
    Organization = require('../models/organization'),
    CRMIntegrations = require('../models/crmintegrations');

/**
 * The account class
 */
var Account = function (details) {
    extend(this, details || {});
    if (!this.profile_image_uid) {
        this.profile_image_uid = 'blankprofile';
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
            params.push(this[valKeys[elm]]);
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
    if(opts.fbId) {
        
    }
}

/**
 * Get an account by its email
 */
Account.GetByEmail = function (cfg, e, cb) {
    cb = cb || function () {};

    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ? LIMIT 1', [e], function (result) {
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
        pw_md5: md5('')
    };
    if (details.password) {
        details.pw_md5 = md5(details.password);
        delete details.password;
    }
    extend(_Defaults, details);
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