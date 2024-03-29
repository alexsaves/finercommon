const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const tablename = 'approvals';
const shortid = require('shortid');
const Email = require('../models/email');
const CRMIntegrations = require('../models/crmintegrations');
const CRMContacts = require('../models/crmcontacts');
const CRMUsers = require('../models/crmusers');

/**
 * The account class
 */
var Approval = function (details) {
  extend(this, details || {});
};

/**
 * States
 */
Approval.SEND_STATES = {
  UNSENT: 0,
  SENT: 1
};

/**
 * Send SMS or Email if necessary
 */
Approval.prototype.execute = function (cfg, cb) {
  const Organization = require('../models/organization');
  if (this.sendState == Approval.SEND_STATES.UNSENT) {
    this.sendState = Approval.SEND_STATES.SENT;
    Organization.GetById(cfg, this.organization_id, (err, org) => {
      if (err) {
        cb(err);
      } else {
        if (this.crm_contact_id) {
          CRMContacts.GetById(cfg, this.crm_contact_id, (err, cntc) => {
            if (err) {
              cb(err);
            } else {
              // Invite updated! Send an updated email
              let emailCtrl = new Email(cfg.email.server, cfg.email.port, cfg.email.key, cfg.email.secret);
              emailCtrl.send(cfg, org.id, cfg.email.defaultFrom, cntc.Email, 'inviteprospectsurvey', cntc.FirstName + ', help ' + org.name + ' do better in the future!', {
                contact: cntc,
                org: org,
                surveyurl: cfg.surveyUrl + "/s/" + encodeURIComponent(this.survey_guid) + "/2?p=" + encodeURIComponent(this.guid)
              }, (err) => {
                if (err) {
                  console.log("Error sending invitation email", err);
                  cb("Error sending invitation email");
                } else {
                  // Success
                  this.commit(cfg, cb);
                }
              });
            }
          });
        } else {
          // Sales person
          CRMUsers.GetById(cfg, this.crm_user_id, (err, cntc) => {
            if (err) {
              cb(err);
            } else {
              // Invite updated! Send an updated email
              let emailCtrl = new Email(cfg.email.server, cfg.email.port, cfg.email.key, cfg.email.secret);
              emailCtrl.send(cfg, org.id, cfg.email.defaultFrom, cntc.Email, 'inviteusersurvey', cntc.FirstName + ', help ' + org.name + ' do better in the future!', {
                contact: cntc,
                org: org,
                surveyurl: cfg.surveyUrl + "/s/" + encodeURIComponent(this.survey_guid) + "/2?p=" + encodeURIComponent(this.guid)
              }, (err) => {
                if (err) {
                  console.log("Error sending invitation email", err);
                  cb("Error sending invitation email");
                } else {
                  // Success
                  this.commit(cfg, cb);
                }
              });
            }
          });
        }
      }
    });
  } else {
    process.nextTick(cb);
  }
};

/**
 * Execute asynchronously an approval
 * @param {*} cfg
 */
Approval.prototype.executeAsync = async function (cfg) {
  await (() => {
    return new Promise(resolve => {
      this.execute(cfg, (err) => {
        resolve(err);
      });
    });
  })();
};

/**
 * Save any changes to the DB row
 */
Approval.prototype.commit = function (cfg, cb) {
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
  query += ' WHERE guid = ?';
  params.push(this.guid);

  dbcmd.cmd(cfg.pool, query, params, function (result) {
    cb(null, this);
  }, function (err) {
    cb(err);
  });
};

/**
 * Get an approval by its id
 */
Approval.GetByGuid = function (cfg, guid, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE guid = ?', [guid], function (result) {
    cb(result.length === 0 ? {
        message: "No approval found."
      } :
      null, result.length > 0 ?
      new Approval(result[0]) :
      null);
  }, function (err) {
    cb(err);
  });
};

/**
 * Get any approvals for the supplied contacts
 * @param {*} cfg
 * @param {*} contacts
 * @param {*} cb
 */
Approval.GetForContacts = function (cfg, contacts, cb) {
  cb = cb || function () {};
  if (contacts.length === 0) {
    process.nextTick(() => {
      cb();
    });
  } else {
    const contactIds = contacts.map(c => c.Id);
    dbcmd.cmd(cfg.pool, `SELECT * FROM ${cfg.db.db}.${tablename} WHERE crm_contact_id IN (${contactIds.map(c => '?').join(', ')}) OR crm_user_id IN (${contactIds.map(c => '?').join(', ')})`, contactIds.concat(contactIds), function (result) {
      if (result && result.length > 0) {
        var res = [];
        for (var i = 0; i < result.length; i++) {
          res.push(new Approval(result[i]));
        }
        cb(null, res);
      } else {
        cb();
      }
    }, function (err) {
      cb(err);
    });
  }
};

/**
 * Get an approval by its oppportunity ID and contact
 */
Approval.GetByOppAndContact = function (cfg, opportunity_id, crm_contact_id, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE opportunity_id = ? AND crm_contact_id = ? LIMIT 1', [
    opportunity_id, crm_contact_id
  ], function (result) {
    if (result && result.length > 0) {
      cb(null, new Approval(result[0]));
    } else {
      cb();
    }
  }, function (err) {
    cb(err);
  });
};

/**
 * Get a collection of approvals
 * @param {*} cfg
 * @param {*} approvals
 * @param {*} cb
 */
Approval.GetList = function (cfg, approvalIds, cb) {
  cb = cb || function () {};
  if (!approvalIds || approvalIds.length === 0) {
    return cb(null, []);
  }
  dbcmd.cmd(cfg.pool, `SELECT * FROM ${cfg.db.db}.${tablename} WHERE guid IN (${approvalIds.map(c => '?').join(', ')})`, approvalIds, function (result) {
    if (result && result.length > 0) {
      var res = [];
      for (var i = 0; i < result.length; i++) {
        res.push(new Approval(result[i]));
      }
      cb(null, res);
    } else {
      cb();
    }
  }, function (err) {
    cb(err);
  });
};

/**
 * Get a bunch of approvals
 * @param {*} cfg
 * @param {*} approvalIds
 */
Approval.GetListAsync = function (cfg, approvalIds) {
  return new Promise((resolve, reject) => {
    Approval.GetList(cfg, approvalIds, (err, aprs) => {
      if (err) {
        reject(err);
      } else {
        resolve(aprs);
      }
    });
  });
};

/**
 * Get an approval by its oppportunity ID and contacts (array)
 */
Approval.GetByOppAndContacts = function (cfg, opportunity_id, crm_contact_ids, cb) {
  cb = cb || function () {};
  if (!crm_contact_ids || crm_contact_ids.length == 0) {
    cb(null, []);
    return;
  }
  if (crm_contact_ids.length == 1) {
    Approval.GetByOppAndContact(cfg, opportunity_id, crm_contact_ids[0], (err, apr) => {
      if (err) {
        cb(err);
      } else {
        if (apr) {
          cb(null, [apr]);
        } else {
          cb(null, []);
        }
      }
    });
    return;
  }
  var cstr = crm_contact_ids.reduce(x => "'" + x + "',");
  cstr = cstr.substr(0, cstr.length - 1);
  dbcmd.cmd(cfg.pool, `SELECT * FROM ${cfg.db.db}.${tablename} WHERE opportunity_id = '${opportunity_id}' AND crm_contact_id IN (${crm_contact_ids.map(c => '?').join(', ')})`, crm_contact_ids, function (result) {
    if (result && result.length > 0) {
      var resset = [];
      for (let g = 0; g < result.length; g++) {
        resset.push(new Approval(result[g]));
      }
      cb(null, resset);
    } else {
      cb(null, []);
    }
  }, function (err) {
    cb(err);
  });
};

/**
 * Get an approval by its oppportunity ID and contacts (array)
 */
Approval.GetByOppAndContactsAsync = function (cfg, opportunity_id, crm_contact_ids) {
  return new Promise((resolve, reject) => {
    Approval.GetByOppAndContacts(cfg, opportunity_id, crm_contact_ids, (err, apprvs) => {
      if (err) {
        reject(err);
      } else {
        resolve(apprvs);
      }
    });
  });
};

/**
 * Delete all
 */
Approval.DeleteAll = function (cfg, cb) {
  cb = cb || function () {};
  dbcmd.cmd(cfg.pool, 'DELETE FROM ' + cfg.db.db + '.' + tablename + ' WHERE guid NOT NULL', function () {
    cb();
  }, function (err) {
    cb(err);
  });
};

/**
 * Create an approval
 */
Approval.Create = function (cfg, details, cb) {
  cb = cb || function () {};
  details = details || {};
  if (typeof details.survey_guid == 'undefined') {
    throw new Error("Missing survey GUID from approval");
  }
  var _Defaults = {
    guid: shortid.generate(),
    created_at: new Date(),
    updated_at: new Date(),
    sendState: Approval.SEND_STATES.UNSENT,
    sendEmail: 0,
    sendSMS: 0,
    created_by_account_id: 0,
    organization_id: 0,
    opportunity_id: "",
    crm_contact_id: 0
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
      Approval
        .GetByGuid(cfg, _Defaults.guid, function (err, apr) {
          if (err) {
            cb(err);
          } else {
            cb(null, apr);
          }
        });
    }, function (err) {
      cb(err);
    });
};

/**
 * Create an approval
 * @param {*} cfg
 * @param {*} details
 */
Approval.CreateAsync = function (cfg, details) {
  return new Promise((resolve, reject) => {
    Approval.Create(cfg, details, (err, apr) => {
      if (err) {
        reject(err);
      } else {
        resolve(apr);
      }
    });
  });
};

// Expose it
module.exports = Approval;