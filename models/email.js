const dbcmd = require('../utils/dbcommand');
const md5 = require('md5');
const extend = require('extend');
const nodemailer = require('nodemailer');
const fs = require('fs');
const _ = require('underscore');
const aws = require('aws-sdk');
const sesTransport = require('nodemailer-ses-transport');
const pug = require('pug');

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
          imagebase: cfg.portalUrl + "/eml/",
          unsuburl: cfg.portalUrl + EmailUnsubscription.GenerateValidUnsubscribeLink(useremail, org)
        }, details);

        /*let attachments = [];
        let imagesdir = __dirname + "/../fixtures/emails/images/";
        
        fs.readdirSync(imagesdir).forEach(file => {
          if (file.indexOf('.png') > -1) {
            attachments.push({
              cid: file.substr(0, file.indexOf(".")),              
              contentType: 'image/png',
              content: fs.readFileSync(imagesdir + file)
            });
          }          
        });*/
        let basetemplatefile = fs
            .readFileSync(__dirname + '/../fixtures/emails/src/_base.pug', 'utf8')
            .toString(),
          baserawtemplatefile = fs
            .readFileSync(__dirname + '/../fixtures/emails/src/_base_raw.txt', 'utf8')
            .toString();
        let templatefile = fs
            .readFileSync(__dirname + '/../fixtures/emails/src/' + template + '.pug', 'utf8')
            .toString(),
          rawtemplatefile = fs
            .readFileSync(__dirname + '/../fixtures/emails/src/' + template + '_raw.txt', 'utf8')
            .toString();
        let richBaseTemplate = pug.compile(basetemplatefile, {});
        let richTemplate = pug.compile(templatefile, {});
        let baseResult = richBaseTemplate(details);
        let templateResult = richTemplate(details);
        templateResult = baseResult.replace(/\[\[main\]\]/i, templateResult);
        let rawtemplateObj = _.template(rawtemplatefile);
        let rawresult = rawtemplateObj(details);

        var transporter = nodemailer.createTransport(sesTransport({region: this.server, accessKeyId: this.key, secretAccessKey: this.secret, rateLimit: 5}));
        //console.log(details);
        //console.log(templateResult);
        //callback();
        //return;
        // Give SES the details and let it construct the message for you.
        //callback(null, templateResult);
        transporter.sendMail({
          to: to,
          from: from,
          subject: subject,
          html: templateResult,
          text: rawresult,
          //attachments: attachments
        }, function (err, data, res) {
          if (callback) {
            //callback(null, templateResult);
            callback(err, data);
          }
        });
      }
    }
  });
};

/**
 * Send an email (ASYNC)
 * @param {*} cfg 
 * @param {*} org 
 * @param {*} from 
 * @param {*} to 
 * @param {*} template 
 * @param {*} subject 
 * @param {*} details 
 */
Email.prototype.sendAsync = function (cfg, org, from, to, template, subject, details) {
  return new Promise((resolve, reject) => {
    this.send(cfg, org, from, to, template, subject, details, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Expose it
module.exports = Email;