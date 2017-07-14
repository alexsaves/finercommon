const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  tablename = 'organizations',
  CRMIntegrations = require('../models/crmintegrations'),
  OrganizationAssociations = require('../models/organizationassociations');

/**
* The organizations class
*/
var Organization = function (details) {
  extend(this, details || {});
};

/**
 * Get the list of integrations for an organization
 */
Organization.prototype.getIntegrations = function (cfg, cb) {
  CRMIntegrations.GetForOrg(cfg, this.id, cb);
};

/**
 * Get the owner of the organization
 */
Organization.prototype.getOwnerAccount = function (cfg, cb) {
  OrganizationAssociations.GetAllForOrg(cfg, this.id, (err, assocs) => {
    if (err) {
      cb(err);
    } else {
      var ownerAssoc = assocs.find((sc) => {
        return sc.assoc_type == 0;
      });
      if (ownerAssoc !== null && typeof ownerAssoc != undefined) {
        Account = require('../models/account');
        Account.GetById(cfg, ownerAssoc.account_id, (err, act) => {
          if (err) {
            cb(err);
          } else {
            cb(null, act);
          }
        });
      } else {
        cb(new Error("Could not find owner"));
      }
    }
  });
};

/**
 * Get the things about the organization that this user is allowed to know
 * (users who have access, oustanding invitations, etc)
 */
Organization.prototype.getSharingSettingsForUser = function (cfg, userid, cb) {
  let models = require('../models/all');
  models
    .Account
    .GetById(cfg, userid, (err, usr) => {
      if (err) {
        cb(err);
      } else {
        usr.getAccessLevelForOrganization(cfg, this.id, (err, accs) => {
          if (err) {
            cb(err);
          } else {
            // Access 0 = owner, 1 = admin, 2 = user
            OrganizationAssociations.GetAllForOrg(cfg, this.id, (err, assocs) => {
              if (err) {
                cb(err);
              } else {
                assocs.forEach((asc) => {
                  asc.type = "ASSOCIATION";
                });
                models
                  .OrganizationInvitation
                  .GetAllByOrg(cfg, this.id, (err, ivts) => {
                    if (err) {
                      cb(err);
                    } else {
                      ivts.forEach((asc) => {
                        asc.type = "INVITE";
                      });
                      let finalList = assocs.concat(ivts);
                      cb(null, {organization_id: this.id, shares: finalList});
                    }
                  });
              }
            });
          }
        });
      }
    });
};

/**
* Get the organizations for a particular account
*/
Organization.GetForAccount = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.org_account_associations WHERE account_id = ?', [id], function (assocresult) {
    if (assocresult.length == 0) {
      cb(null, []);
    } else {
      let idlist = [];
      for (let t = 0; t < assocresult.length; t++) {
        idlist.push(assocresult[t].organization_id);
      }
      dbcmd
        .cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id IN (' + idlist.join(', ') + ')', function (result) {
          let outOrgs = [];
          for (let h = 0; h < result.length; h++) {
            let org = new Organization(result[h]);
            let assoc = assocresult.find(function (val) {
              return val.organization_id == org.id;
            });
            org.association = assoc;
            outOrgs.push(org);
          }
          cb(null, outOrgs);
        }, function (err) {
          cb(err);
        });
    }
  }, function (err) {
    cb(err);
  });
};

/**
* Get an org by its id
*/
Organization.GetById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(result.length === 0
      ? {
        message: "No user found."
      }
      : null, result.length > 0
      ? new Organization(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Delete an org by its id
*/
Organization.DeleteById = function (cfg, id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE id = ?', [id], function (result) {
    cb(null);
  }, function (err) {
    cb(err);
  });
};

/**
* Create a account
*/
Organization.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    name: "",
    created_at: new Date(),
    updated_at: new Date()
  };
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
      Organization
        .GetById(cfg, result.insertId, function (err, org) {
          if (err) {
            cb(err);
          } else {
            cb(null, org);
          }
        });
    }, function (err) {
      cb(err);
    });
};

/**
 * Save any changes to the DB row
 */
Organization.prototype.commit = function (cfg, cb) {
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

// Expose it
module.exports = Organization;