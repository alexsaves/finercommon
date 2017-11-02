const dbcmd = require('../utils/dbcommand'),
md5 = require('md5'),
extend = require('extend'),
uuidV4 = require('uuid/v4'),
utils = require('../utils/utils'),
tablename = 'crm_integrations';

/**
* The crm opportunity class
*/
var CRMOpportunities = function (details) {
extend(this, details || {});
};

/**
* Create an opportunity
*/
CRMOpportunities.Create = function (cfg, data, extraFields, cb) {
cb = cb || function () {};
const rowDict = [{
  name: "Id",
  row_name: "Id"
},
{
  name: "AccountId",
  row_name: "AccountId"
},
{
  name: "Amount",
  row_name: "Amount"
},
{
  name: "IsClosed",
  row_name: "IsClosed"
},
{
  name: "IsWon",
  row_name: "IsWon"
},
{
  name: "OwnerId",
  row_name: "OwnerId"
},
{
  name: "StageName",
  row_name: "StageName"
}];
const { query, params } = utils.createInsertOrUpdateStatementGivenData(cfg.db.db, 'crm_opportunities', data, rowDict, extraFields, 'Id');

console.log(query);
dbcmd
  .cmd(cfg.pool, query, params, function (result) {
    console.log(result);
  }, function (err) {
    cb(err);
  });
};

// Expose it
module.exports = CRMOpportunities;