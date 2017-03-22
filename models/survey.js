var dbcmd = require('../../app/utils/dbcommand'),
md5 = require('md5'),
extend = require('extend'),
tablename = 'surveys',
shortid = require('shortid');

/**
* The survey class
*/
var Survey = function(details) {
  extend(this, details || {});
};

/**
* Get a survey by its guid
*/
Survey.GetByGuid = function(cfg, guid, cb) {
  cb = cb || function() {};
  dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE guid = ?', [guid], function (result) {
    cb(result.length === 0 ? {message: "No user found."} : null, result.length > 0 ? new Survey(result[0]) : null);
  }, function(err) {
    cb(err);
  });
};


/**
* Create a prospect
*/
Survey.Create = function(cfg, details, cb) {
  cb = cb || function() {};
  details = details || {};
  var _Defaults = {
    guid: shortid.generate(),
    name: "",
    organization_id: 0,
    prospect_id: 0,
    created_at: new Date(),
    updated_at: new Date(),
    survey_model: new Buffer(JSON.stringify({
      pages: [
      {
        name: "page1",
        questions: [
        {
          type: "comment",
          name: "general1",
          placeHolder: "right here",
          title: "Give us your opinion please!"
        },
        {
          type: "radiogroup",
          choices: [
          {
            value: "1",
            text: "first item"
          },
          {
            value: "2",
            text: "second item"
          },
          {
            value: "3",
            text: "third item"
          }
          ],
          name: "question1",
          title: "sdlkjg ldfkjg ldfkjgssldfk gjldkfj glkdfjs glkj d"
        }
        ]
      }
      ]
    }))
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
  dbcmd.cmd(cfg.pool, query, params, function(result) {    
    Survey.GetByGuid(cfg, _Defaults.guid, function(err, org) {
      if (err) {
        cb(err);
      } else {
        cb(null, org);
      }
    });
  }, function(err) {
    cb(err);
  });
};

// Expose it
module.exports = Survey;