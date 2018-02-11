const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const nodemailer = require('nodemailer');
const fs = require('fs');
const _ = require('underscore');
const aws = require('aws-sdk');
const sesTransport = require('nodemailer-ses-transport');

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
  let useremail = Email._extractEmailFromString(to);
  let EmailUnsubscription = require('./emailunsubscription');
  EmailUnsubscription.EmailCanReceiveMessages(cfg, useremail, org, (err, canit) => {
    if (err) {
      callback(err);
    } else {
      if (!canit) {
        console.log("NOT SENDING EMAIL TO ", useremail);
        callback();
      } else {
        details = extend({
          unsuburl: cfg.portalUrl + EmailUnsubscription.GenerateValidUnsubscribeLink(useremail, org)
        }, details);

        // let client = ses.createClient({key: this.key, secret: this.secret, amazon:
        // this.server});
        let attachments = [];
        let imagesdir = __dirname + "/../fixtures/emails/images/";
        
        fs.readdirSync(imagesdir).forEach(file => {
          if (file.indexOf('.png') > -1) {
            attachments.push({
              cid: file.substr(0, file.indexOf(".")),              
              contentType: 'image/png',
              content: fs.readFileSync(imagesdir + file)
            });
          }          
        });
        
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

        var transporter = nodemailer.createTransport(sesTransport({region: this.server, accessKeyId: this.key, secretAccessKey: this.secret, rateLimit: 5}));

        // Give SES the details and let it construct the message for you.
        transporter.sendMail({
          to: to,
          from: from,
          subject: subject,
          html: result,
          text: rawresult,
          attachments: attachments
        }, function (err, data, res) {
          if (callback) {
            callback(err, data);
          }
        });
      }
    }
  });
};

// Expose it
module.exports = Email;