const dbcmd = require('../utils/dbcommand'),
  md5 = require('md5'),
  extend = require('extend'),
  ses = require('node-ses'),
  fs = require('fs'),
  _ = require('underscore');

/**
* Module for sending email
*/
var Email = function (server, port, key, secret) {
  this.server = server;
  this.port = port;
  this.key = key;
  this.secret = secret;
};

/**
 * Extract emails from a string
 * @param {String} searchInThisString 
 */
Email._extractEmailFromString = function (searchInThisString) {
  var foundEmails = [];
  var emailRegex = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
  var gotcha;

  while (match = emailRegex.exec(searchInThisString)) {

    //-- store in array the found match email
    foundEmails.push(match[0]);

    //-- remove the found email and continue search if there are still emails
    searchInThisString = searchInThisString.replace(match[0], "")
  }
  return foundEmails[0];
};

/**
 * Send an email
 */
Email.prototype.send = function (cfg, org, from, to, template, subject, details, callback) {
  callback = callback || function () {};
  if (arguments.length < 8) {
    throw new Error("Email controller - missing callback");
  }
  let EmailUnsubscription = require('./emailunsubscription');
  details = extend({
    unsuburl: cfg.portalUrl + EmailUnsubscription.GenerateValidUnsubscribeLink(Email._extractEmailFromString(to), org)
  }, details);

  let client = ses.createClient({key: this.key, secret: this.secret, amazon: this.server});

  let templatefile = fs
      .readFileSync(__dirname + '/../fixtures/emails/dist/' + template + '.html', 'utf8')
      .toString(),
    rawtemplatefile = fs
      .readFileSync(__dirname + '/../fixtures/emails/dist/' + template + '_raw.txt', 'utf8')
      .toString();
  let templateObj = _.template(templatefile),
    rawtemplateObj = _.template(rawtemplatefile);
  let result = templateObj(details),
    rawresult = rawtemplateObj(details);

  // Give SES the details and let it construct the message for you.
  client.sendEmail({
    to: to,
    from: from,
    subject: subject,
    message: result,
    altText: rawresult
  }, function (err, data, res) {
    callback(err, data);
  });
};

// Expose it
module.exports = Email;