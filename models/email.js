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
 * Send an email
 */
Email.prototype.send = function (from, to, template, subject, details, callback) {
  callback = callback || function() {};
  let client = ses.createClient({key: this.key, secret: this.secret, amazon: this.server});

  let templatefile = fs.readFileSync(__dirname + '/../fixtures/emails/dist/' + template + '.html', 'utf8').toString(),
    rawtemplatefile = fs.readFileSync(__dirname + '/../fixtures/emails/dist/' + template + '_raw.txt', 'utf8').toString();
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