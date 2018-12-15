const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const uuidV4 = require('uuid/v4');
const bityProm = require('bity-promise');
const Account = require('../models/account');
const OrgAssoc = require('../models/organizationassociations');
const email = require('../models/email');
const Org = require('../models/organization');
const tablename = 'org_invitations';

/**
* The organizations class
*/
var OrganizationInvitation = function (details) {
  extend(this, details || {});
};

/**
* Get an invite by its uid
*/
OrganizationInvitation.GetByUID = function (cfg, uid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid = ?', [uid], function (result) {
    cb(result.length === 0
      ? {
        message: "No org invites found."
      }
      : null, result.length > 0
      ? new OrganizationInvitation(result[0])
      : null);
  }, function (err) {
    cb(err);
  });
};

/**
* Is there an invite for an organization and a specific email?
*/
OrganizationInvitation.GetForEmailAndOrg = function (cfg, email, orgid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ? AND organization_id = ? LIMIT 1', [
    email, orgid
  ], function (result) {
    let res = null;
    if (result && result.length > 0) {
      res = new OrganizationInvitation(result[0]);
    }
    cb(null, res);
  }, function (err) {
    cb(err);
  });
};

/**
 * Add org information to the invite list
 */
OrganizationInvitation.PopulateOrgInformation = function (cfg, inviteList, cb) {
  cb = cb || function () {};
  if (!inviteList || inviteList.length == 0) {
    cb(null, inviteList);
  } else {
    let idlist = inviteList.map(function (x) {
      return x.organization_id;
    });
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.organizations WHERE id IN (' + idlist.join(',') + ')', function (results) {
      inviteList.forEach((ivt) => {
        results.forEach((res) => {
          if (ivt.organization_id == res.id) {
            ivt.org = res;
          }
        });
      });
      cb(null, inviteList);
    }, function (err) {
      cb(err);
    });
  }
};

/**
* Get all invites by email
*/
OrganizationInvitation.GetAllByEmail = function (cfg, email, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ?', [email], function (results) {
    let list = [];
    for (let i = 0; i < results.length; i++) {
      list.push(new OrganizationInvitation(results[i]));
    }
    OrganizationInvitation.PopulateOrgInformation(cfg, list, cb);
  }, function (err) {
    cb(err);
  });
};

/**
* Get all invites by organization id
*/
OrganizationInvitation.GetAllByOrg = function (cfg, orgid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE organization_id = ?', [orgid], function (results) {
    let list = [];
    for (let i = 0; i < results.length; i++) {
      list.push(new OrganizationInvitation(results[i]));
    }
    OrganizationInvitation.PopulateOrgInformation(cfg, list, cb);
  }, function (err) {
    cb(err);
  });
};

/**
 * Convert an array of UIDS to a list of invites
 */
OrganizationInvitation.GetInvitesByUIDs = function (cfg, uids, cb) {
  cb = cb || function () {};
  var formattedUIDS = uids.map(function (el) {
    return "'" + el + "'";
  });
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid IN (' + formattedUIDS.join(',') + ')', function (results) {
    let list = [];
    for (let i = 0; i < results.length; i++) {
      list.push(new OrganizationInvitation(results[i]));
    }
    OrganizationInvitation.PopulateOrgInformation(cfg, list, cb);
  }, function (err) {
    cb(err);
  });
};

/**
 * Delete a list of UIDs
 */
OrganizationInvitation.DeleteInvitesByUIDs = function (cfg, uids, cb) {
  cb = cb || function () {};
  var formattedUIDS = uids.map(function (el) {
    return "'" + el + "'";
  });
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid IN (' + formattedUIDS.join(',') + ')', function () {
    cb(null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Convert the array of UIDs into accepted invitations
 */
OrganizationInvitation.ActivateInvitationsByUID = function (cfg, defaultFrom, emailServer, emailPort, emailKey, emailSecret, uids, cb) {
  cb = cb || function () {};
  OrganizationInvitation.GetInvitesByUIDs(cfg, uids, (err, list) => {
    if (err) {
      cb(err);
    } else {
      if (!list || list.length == 0) {
        cb(null);
      } else {
        let p = new bityProm(function () {
          cb(null);
        }, function () {
          cb(new Error("Timed out."));
        }, 10000);
        p.make(list.map(function (el) {
          return el.uid;
        }));
        list.forEach(function (ivt) {
          ivt.AcceptInvite(cfg, defaultFrom, emailServer, emailPort, emailKey, emailSecret, (err) => {
            if (err) {
              p.break(ivt.uid);
            } else {
              p.resolve(ivt.uid);
            }
          });
        });
      }
    }
  });
};

/**
 * Convert the array of UIDs into declined invitations
 */
OrganizationInvitation.DeclineInvitationsByUID = function (cfg, defaultFrom, emailServer, emailPort, emailKey, emailSecret, uids, cb) {
  cb = cb || function () {};
  OrganizationInvitation.GetInvitesByUIDs(cfg, uids, (err, list) => {
    if (err) {
      cb(err);
    } else {
      if (!list || list.length == 0) {
        cb(null);
      } else {
        let p = new bityProm(function () {
          cb(null);
        }, function () {
          cb(new Error("Timed out."));
        }, 10000);
        p.make(list.map(function (el) {
          return el.uid;
        }));
        list.forEach(function (ivt) {
          ivt.DeclineInvite(cfg, defaultFrom, emailServer, emailPort, emailKey, emailSecret, (err) => {
            if (err) {
              p.break(ivt.uid);
            } else {
              p.resolve(ivt.uid);
            }
          });
        });
      }
    }
  });
};

/**
 * Convert an invitation into an accepted invitation
 */
OrganizationInvitation.prototype.AcceptInvite = function (cfg, defaultFrom, emailServer, emailPort, emailKey, emailSecret, cb) {
  cb = cb || function () {};
  Account.GetByEmail(cfg, this.email, (err, act) => {
    if (err) {
      cb(err);
    } else {
      Account.GetById(cfg, this.invited_by_account_id, (err, iact) => {
        if (err) {
          cb(err);
        } else {
          Org.GetById(cfg, this.organization_id, (err, org) => {
            if (err) {
              cb(err);
            } else {
              OrgAssoc.Create(cfg, {
                account_id: act.id,
                organization_id: this.organization_id,
                assoc_type: this.assoc_type,
                perm_level: this.perm_level
              }, (err, assoc) => {
                if (err) {
                  cb(err);
                } else {
                  // Send an email to the originator
                  let emailCtrl = new email(emailServer, emailPort, emailKey, emailSecret);
                  emailCtrl.send(cfg, this.organization_id, defaultFrom, iact.email, 'inviteaccepted', 'User ' + act.name + ' has accepted ' + org.name + ' on FinerInk', {
                    account: act,
                    invite: this,
                    org: org
                  }, (err) => {
                    if (err) {
                      console.log("Error sending email", err);
                      cb(new Error("Error sending email."));
                    } else {
                      // Success
                      this.Delete(cfg, cb);
                    }
                  });
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
 * Decline an invitation
 */
OrganizationInvitation.prototype.DeclineInvite = function (cfg, defaultFrom, emailServer, emailPort, emailKey, emailSecret, cb) {
  cb = cb || function () {};
  Account.GetById(cfg, this.invited_by_account_id, (err, iact) => {
    if (err) {
      cb(err);
    } else {
      Org.GetById(cfg, this.organization_id, (err, org) => {
        if (err) {
          cb(err);
        } else {
          Account.GetByEmail(cfg, this.email, (err, act) => {
            if (err) {
              cb(err);
            } else {
              // Send an email to the originator
              let emailCtrl = new email(emailServer, emailPort, emailKey, emailSecret);
              emailCtrl.send(cfg, org.id, defaultFrom, iact.email, 'invitedeclined', 'User ' + act.name + ' has declined ' + org.name + ' on FinerInk', {
                account: act,
                invite: this,
                org: org
              }, (err) => {
                if (err) {
                  console.log("Error sending email", err);
                  cb(new Error("Error sending email."));
                } else {
                  // Success
                  this.Delete(cfg, cb);
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
 * Delete all invitations
 */
OrganizationInvitation.DeleteAll = function (cfg, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid != NULL', function () {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
 * Delete all invitations (ASYNC)
 */
OrganizationInvitation.DeleteAllAsync = function (cfg) {
  return new Promise((resolve, reject) => {
    OrganizationInvitation.DeleteAll(cfg, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Delete an invitation
 */
OrganizationInvitation.prototype.Delete = function (cfg, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE uid = ?', this.uid, function (results) {
    cb(null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Save any changes to the DB row
 */
OrganizationInvitation.prototype.commit = function (cfg, cb) {
  cb = cb || function () {};
  var excludes = [
      'uid', 'created_at', 'org'
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
  query += ' WHERE uid = ?';
  params.push(this.uid);

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    cb(null, this);
  }, function (err) {
    cb(err);
  });
};

/**
* Create an invitation
*/
OrganizationInvitation.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  var _Defaults = {
    uid: uuidV4().toString(),
    created_at: new Date(),
    updated_at: new Date(),
    organization_id: 0,
    invited_by_account_id: 0,
    email: '',
    assoc_type: 0,
    perm_level: 0
  };
  extend(_Defaults, details);
  _Defaults.email = _Defaults
    .email
    .trim()
    .toLowerCase();
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
      OrganizationInvitation
        .GetByUID(cfg, _Defaults.uid, function (err, org) {
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

// Expose it
module.exports = OrganizationInvitation;