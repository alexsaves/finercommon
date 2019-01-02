var finercommon = require('../index');
var models = finercommon.models;
const moment = require('moment');
const faker = require('faker');
const shortid = require('shortid');
const loremIpsum = require('lorem-ipsum');
const md5 = require('md5');
const rwc = require('random-weighted-choice');

/**
 * Make a fake account and associated org and integration
 * @param {*} cfg 
 * @param {*} email 
 * @param {*} fName 
 * @param {*} lName 
 * @param {*} orgName 
 */
const MakeFakeAccount = async function (cfg, email, fName, lName, orgName, when, pw, logger) {
  logger("\Creating account (" + email + ")...");
  finercommon = require('../index.js');
  models = finercommon.models;
  // Start with the account record itself
  var act = await models.Account.CreateAsync(cfg, {
    name: fName + ' ' + lName,
    created_at: when,
    updated_at: when,
    email: email,
    pw_md5: md5(pw),
    emailverified: true,
    is_active: 1
  });

  // Make an organization for that account
  var org = await models.Organization.CreateAsync(cfg, {
    name: orgName,
    created_at: when,
    updated_at: when
  });

  // Make an org association from this user to this account
  var oasc = await models.OrganizationAssociation.CreateAsync(cfg, {
    created_at: when,
    updated_at: when,
    account_id: act.id,
    organization_id: org.id,
    assoc_type: 0
  });

  // Now make an integration
  var intr = await models.CRMIntegrations.CreateAsync(cfg, {
    created_at: when,
    updated_at: when,
    organization_id: org.id,
    crm_type: 'SALESFORCE',
    info: '{}',
    is_active: 1,
    uq: shortid.generate().toUpperCase(),
    connection_name: 'FinerInk',
    owner_names: Buffer.from(JSON.stringify({
      "label": "All Owners",
      "value": "all"
    })),
    owner_roles: Buffer.from("\"*\"")
  });

  // Now make the 
  var rlz = await models.CRMIntegrationRules.CreateAsync(cfg, {
    created_at: when,
    updated_at: when,
    id: shortid.generate().toUpperCase(),
    owner_names: Buffer.from(JSON.stringify({ "value": "all", "label": "All Owners" })),
    owner_roles: Buffer.from("\"*\""),
    approvers: Buffer.from(JSON.stringify({ "value": "all", "label": "All Users" })),
    integration_id: intr.uid
  });

  return act;
};

/**
 * Generate Data
 * @param {ConnectionPool} pool 
 * @param {String} email 
 */
const GenerateDataForAccount = async function (cfg, email, days, oppsperday, resps, salesorgsize, logger) {
  finercommon = require('../index.js');
  models = finercommon.models;
  logger("\nLocating account (" + email + ")...");
  
  // Delete the report cache
  await models.OrgReportCache.DeleteAllAsync(cfg);
  
  const account = await models.Account.GetByEmailAsync(cfg, email);
  if (!account) {
    throw new Error("Account not found!");
  }
  logger("Enforcing account is active...");
  account.is_active = 1;
  await account.commitAsync(cfg);
  logger("Prebuilding a set of known job titles...");
  const jobTitleList = [];
  for (let i = 0; i < 10; i++) {
    jobTitleList.push({ id: faker.name.jobTitle(), weight: Math.round(Math.random() * 10) + 1 });
  }

  logger("Getting orgs...");
  const orgs = await account.getOrganizationsAsync(cfg);
  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    await GenerateDataForOrg(cfg, account, org, days, oppsperday, resps, salesorgsize, jobTitleList, logger);
  }
};

/**
 * Create data for organization
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const GenerateDataForOrg = async function (cfg, account, org, days, oppsperday, resps, salesorgsize, jobTitleList, logger) {
  logger("Creating fixtures for (" + org.name + ")...");
  logger("Getting integrations...");
  const intrs = await org.getIntegrationsAsync(cfg);
  for (let i = 0; i < intrs.length; i++) {
    const intr = intrs[i];
    await GenerateDataForInt(cfg, account, org, intr, days, oppsperday, resps, salesorgsize, jobTitleList, logger);
  }
};

/**
 * Create data for integration
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const GenerateDataForInt = async function (cfg, account, org, intr, days, oppsperday, resps, salesorgsize, jobTitleList, logger) {
  logger("Creating fixtures for integration (" + intr.crm_type + ")...");
  logger("Clearing data for integration...");
  await intr.clearOpportunityDataAsync(cfg);
  logger('Creating (' + salesorgsize.toString() + ') CRM Users...');
  const salesOrgList = [];
  for (let i = 0; i < salesorgsize; i++) {
    // Make the company
    const fname = faker.name.firstName();
    const lname = faker.name.lastName();
    const uemail = faker.internet.email();
    const crmUserInfo = {
      Id: shortid.generate().toUpperCase(),
      FirstName: fname,
      LastName: lname,
      Name: fname + ' ' + lname,
      Email: uemail,
      Username: uemail
    };
    const extraFields = [{
      name: 'integration_id',
      value: intr.uid
    },
    {
      name: 'Metadata',
      value: Buffer.from(JSON.stringify({}))
    }];
    salesOrgList.push(crmUserInfo);
    const cuser = await models.CRMUsers.CreateAsync(cfg, [crmUserInfo], extraFields);
  }
  logger(`Generating opportunities (${days} days with ${oppsperday} per day with ${resps} respondents per opportunity)`);

  // Weight feature & competitor list
  let employeeFeatures = [];
  let customerFeatures = [];
  for (let i = 0; i < org.feature_list.length; i++) {
    employeeFeatures.push({
      id: org.feature_list[i] + "::" + i,
      weight: Math.round(Math.random() * 10) + 1
    });
    customerFeatures.push({
      id: org.feature_list[i] + "::" + i,
      weight: Math.round(Math.random() * 10) + 1
    });
  }
  employeeFeatures.push({
    id: "Other::" + 9999,
    weight: Math.round(Math.random() * 10) + 1
  });
  customerFeatures.push({
    id: "Other::" + 9999,
    weight: Math.round(Math.random() * 10) + 1
  });
  org.customer_feature_list = customerFeatures;
  org.employee_feature_list = employeeFeatures;

  //competitor_list
  let employeeCompetitors = [];
  let customerCompetitors = [];
  for (let i = 0; i < org.competitor_list.length; i++) {
    employeeCompetitors.push({
      id: org.competitor_list[i],
      weight: Math.round(Math.random() * 10) + 1
    });
    customerCompetitors.push({
      id: org.competitor_list[i],
      weight: Math.round(Math.random() * 10) + 1
    });
  }
  org.customer_competitor_list = employeeCompetitors;
  org.employee_competitor_list = customerCompetitors;

  const hourincrements = (24 / oppsperday);
  // Start iterating over time
  const endDate = moment();
  const startDate = moment().subtract(days, 'days');
  const movingDate = startDate.clone();
  logger(`Will make opportunities from ${startDate.format('LLLL')} to ${endDate.format('LLLL')}...`);


  // Main reasons (customer)
  const mainReasonsNotChosenCust = [
    { weight: Math.round(Math.random() * 20) + 1, id: 0 },
    { weight: Math.round(Math.random() * 20) + 1, id: 1 },
    { weight: Math.round(Math.random() * 20) + 1, id: 2 },
    { weight: Math.round(Math.random() * 20) + 1, id: 3 },
    { weight: Math.round(Math.random() * 20) + 1, id: 4 },
    { weight: Math.round(Math.random() * 20) + 1, id: 5 },
    { weight: Math.round(Math.random() * 20) + 1, id: 9999 }
  ];
  const mainReasonsNotChosenEmp = [
    { weight: Math.round(Math.random() * 20) + 1, id: 0 },
    { weight: Math.round(Math.random() * 20) + 1, id: 1 },
    { weight: Math.round(Math.random() * 20) + 1, id: 2 },
    { weight: Math.round(Math.random() * 20) + 1, id: 3 },
    { weight: Math.round(Math.random() * 20) + 1, id: 4 },
    { weight: Math.round(Math.random() * 20) + 1, id: 5 },
    { weight: Math.round(Math.random() * 20) + 1, id: 9999 }
  ];


  // Create the contacts for the opportunity and their opportunity roles
  const contactRoles = [
    { weight: 1, id: "Executive Sponsor" },
    { weight: 3, id: "Economic Buyer" },
    { weight: 1, id: "Business User" },
    { weight: 2, id: "Economic Decision Maker" },
  ];

  while (movingDate.isBefore(endDate)) {
    logger("Making opportunity and data for " + movingDate.format('LLLL') + "...");
    const randIncr = Math.random();
    var addlHrs = 0;
    if (randIncr > 0.7) {
      addlHrs = Math.random() * 48 * 2;
    }
    movingDate.add(hourincrements + addlHrs, 'hours');

    await GenerateOpportunity(cfg, account, org, intr, movingDate.clone(), resps, salesOrgList, jobTitleList, logger, mainReasonsNotChosenCust, mainReasonsNotChosenEmp, contactRoles);
  }
};

/**
 * Generate an opportunity
 * @param {*} cfg 
 * @param {*} org 
 * @param {*} intr 
 * @param {*} when 
 */
const GenerateOpportunity = async function (cfg, account, org, intr, when, resps, salesOrgUsers, jobTitleList, logger, mainReasonsNotChosenCust, mainReasonsNotChosenEmp, contactRoles) {
  const salesPerson = salesOrgUsers[Math.floor(Math.random() * salesOrgUsers.length)];
  // Make the company
  const companyAccountInfo = {
    Id: shortid.generate().toUpperCase(),
    OwnerId: salesPerson.Id,
    Name: faker.company.companyName()
  };
  const extraFields = [{
    name: 'integration_id',
    value: intr.uid
  },
  {
    name: 'Metadata',
    value: Buffer.from(JSON.stringify({}))
  }];
  // Create the propect (company) entry
  const cact = await models.CRMAccounts.CreateAsync(cfg, [companyAccountInfo], extraFields);

  // Create the opportunity entry
  const opportunityInfo = {
    Id: shortid.generate().toUpperCase(),
    AccountId: companyAccountInfo.Id,
    Amount: Math.round((Math.random() * 100000) + 10000),
    IsClosed: true,
    IsWon: false,
    OwnerId: salesPerson.Id,
    StageName: "Closed Lost",
    MetaData: Buffer.from(JSON.stringify({})),
    Name: companyAccountInfo.Name + " Opportunity",
    CloseDate: when.format("YYYY-MM-DD HH:mm:ss"),
    integration_id: intr.uid,
    approval_status: true
  };
  const oppExtraFields = [{
    name: 'integration_id',
    value: intr.uid
  }];
  const oppResult = await models.CRMOpportunities.CreateAsync(cfg, [opportunityInfo], oppExtraFields);
  await models.CRMOpportunities.setApprovalStatusOnIdAsync(cfg, true, opportunityInfo.Id);

  // Create the survey (one for salesperson and one for contacts)
  const employeeSv = await models.Survey.CreateAsync(cfg, {
    organization_id: org.id,
    survey_type: models.Survey.SURVEY_TYPES.EMPLOYEE,
    survey_model: Buffer.from(JSON.stringify(models.Survey.getSurveyFixture(models.Survey.SURVEY_TYPES.EMPLOYEE))),
    name: companyAccountInfo.Name + " Employee Feedback",
    is_active: 1,
    opportunity_id: opportunityInfo.Id,
    created_at: when.toDate(),
    updated_at: when.toDate()
  });
  const contactSv = await models.Survey.CreateAsync(cfg, {
    organization_id: org.id,
    survey_type: models.Survey.SURVEY_TYPES.PROSPECT,
    survey_model: Buffer.from(JSON.stringify(models.Survey.getSurveyFixture(models.Survey.SURVEY_TYPES.PROSPECT))),
    name: companyAccountInfo.Name + " Prospect Feedback",
    is_active: 1,
    opportunity_id: opportunityInfo.Id,
    created_at: when.toDate(),
    updated_at: when.toDate()
  });

  const oppContacts = [];
  for (let i = 0; i < resps; i++) {
    const fname = faker.name.firstName();
    const lname = faker.name.lastName();
    const uemail = faker.internet.email();
    const oppContact = {
      Id: shortid.generate().toUpperCase(),
      OwnerId: salesPerson.Id,
      FirstName: fname,
      LastName: lname,
      Title: rwc(jobTitleList),
      Email: uemail,
      MetaData: Buffer.from(JSON.stringify({})),
      Name: fname + ' ' + lname,
      integration_id: intr.uid
    };
    oppContacts.push(oppContact);
    const contactResult = await models.CRMContacts.CreateOneAsync(cfg, oppContact, oppExtraFields);
    const oppRole = {
      ContactId: oppContact.Id,
      Id: shortid.generate().toUpperCase(),
      IsPrimary: (i === 0) ? 1 : 0,
      OpportunityId: opportunityInfo.Id,
      Role: rwc(contactRoles)
    };
    oppContact.role = oppRole;
    const roleResult = await models.CRMOpportunityRoles.CreateAsync(cfg, [oppRole], oppExtraFields);

    // Make the respondent's survey
    await GenerateRespondent(cfg, when, opportunityInfo.Id, account, org, companyAccountInfo, salesPerson, contactResult, false, contactSv, org.customer_feature_list, org.customer_competitor_list, oppContacts, jobTitleList, logger, mainReasonsNotChosenCust);
  }

  // Make the salesperson's survey
  await GenerateRespondent(cfg, when, opportunityInfo.Id, account, org, companyAccountInfo, salesPerson, null, true, employeeSv, org.employee_feature_list, org.employee_competitor_list, oppContacts, jobTitleList, logger, mainReasonsNotChosenEmp);
};

/**
 * Make a respondent
 */
const GenerateRespondent = async function (cfg, when, oppid, account, org, companyAccountInfo, salesPerson, contact, isSalesperson, sv, featureList, competitorList, oppContacts, jobTitleList, logger, mainReasonsNotChosen) {
  // Make the approval entry
  const apr = await models.Approval.CreateAsync(cfg, {
    sendEmail: 1,
    sendState: models.Approval.SEND_STATES.SENT,
    created_at: when.toDate(),
    updated_at: when.toDate(),
    created_by_account_id: account.id,
    organization_id: org.id,
    crm_contact_id: !isSalesperson ? contact.Id : null,
    crm_user_id: isSalesperson ? salesPerson.Id : null,
    survey_guid: sv.guid,
    opportunity_id: oppid
  });

  // Get the survey response
  const respModel = GenerateSurveyResponseModel(featureList, competitorList, oppContacts, jobTitleList, mainReasonsNotChosen);

  // Set the variables
  const respVars = {
    companyName: org.name,
    prospectName: companyAccountInfo.Name,
    surveyTheme: org.default_survey_template,
    surveyTitle: org.name + " Feedback",
    decisionMakerList: ""
  };

  for (let i = 0; i < org.competitor_list.length; i++) {
    respVars["competitor" + (i + 1)] = org.competitor_list[i];
  }

  for (let i = 0; i < org.feature_list.length; i++) {
    respVars["feature" + (i + 1)] = org.feature_list[i];
  }

  for (let i = 0; i < oppContacts.length; i++) {
    respVars["decisionMaker" + (i + 1)] = oppContacts[i].Name + ", " + oppContacts[i].Title;
    if (i > 0) {
      respVars.decisionMakerList += ", ";
    }
    respVars.decisionMakerList += oppContacts[i].Name;
  }

  // Create the respondent
  const respEntry = await models.Respondent.CreateAsync(cfg, {
    created_at: when.toDate(),
    updated_at: when.toDate(),
    survey_guid: sv.guid,
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
    ip_addr: "::1",
    time_zone: 480,
    is_active: 1,
    approval_guid: apr.guid,
    variables: respVars,
    answers: respModel
  });

  // Apply the answers
  await respEntry.applyAnswersForSurveyAsync(cfg, sv, { answers: respModel });
};

/**
 * Make a response model
 */
const GenerateSurveyResponseModel = function (featureList, competitorList, oppContacts, jobTitleList, mainReasonsNotChosen) {
  const resultModel = {};
  
  resultModel.answers = {
    buyXRating: Math.floor(Math.random() * 7) + 1,
    whyNotSelected: {
      responses: [],
      other: ""
    }
  };
  for (let i = 0; i < 2; i++) {
    let newOne = parseInt(rwc(mainReasonsNotChosen));
    while (resultModel.answers.whyNotSelected.responses.indexOf(newOne) > -1) {
      newOne = parseInt(rwc(mainReasonsNotChosen));
    }
    resultModel.answers.whyNotSelected.responses.push(newOne);
  }

  // Did they pick "other"
  if (resultModel.answers.whyNotSelected.responses.indexOf(9999) > -1) {
    resultModel.answers.whyNotSelected.other = loremIpsum({ count: 3, units: 'words' });
  }

  // Did they pick "price"
  if (resultModel.answers.whyNotSelected.responses.indexOf(0) > -1) {
    const priceOptions = [
      0,
      1,
      2,
      3
    ];
    resultModel.answers.pricingModel = priceOptions[Math.floor(Math.random() * priceOptions.length)];
    switch (resultModel.answers.pricingModel) {
      case 0:
        resultModel.answers.flatFeeAmountDetails = Math.round(Math.random() * 25000) + 1000;
        break;
      case 1:
        resultModel.answers.annualSubscriptionDetails = Math.round(Math.random() * 25000) + 1000;
        break;
      case 2:
        resultModel.answers.percentageRateDetails = loremIpsum({ count: 10, units: 'words' });
        break;
      case 3:
        resultModel.answers.pricePerVolumeDetails = loremIpsum({ count: 10, units: 'words' });
        break;
    }
  }

  // They picked product and service features
  if (resultModel.answers.whyNotSelected.responses.indexOf(1) > -1) {
    let myssingBla = rwc(featureList).split('::')[1];
    resultModel.answers.missingFeature = {
      response: parseInt(myssingBla),
      other: ""
    };
    // Fill the other
    if (resultModel.answers.missingFeature.response == 9999) {
      resultModel.answers.missingFeature.other = loremIpsum({ count: 3, units: 'words' });
    }
  }

  // They picked does not meet our business needs
  if (resultModel.answers.whyNotSelected.responses.indexOf(2) > -1) {
    resultModel.answers.valueReasons = loremIpsum({ count: 10, units: 'words' });
  }

  // They picked timeliness of delivery
  if (resultModel.answers.whyNotSelected.responses.indexOf(3) > -1) {
    const deliveryTimelinessOpts = [
      0,
      1,
      2,
      3,
      4,
      5
    ];
    resultModel.answers.desiredTimeline = {};
    resultModel.answers.desiredTimeline.response = deliveryTimelinessOpts[Math.floor(Math.random() * deliveryTimelinessOpts.length)];
  }

  // They picked customer service
  if (resultModel.answers.whyNotSelected.responses.indexOf(4) > -1) {
    resultModel.answers.serviceReasons = loremIpsum({ count: 10, units: 'words' });
  }

  // They picked external factors
  if (resultModel.answers.whyNotSelected.responses.indexOf(5) > -1) {
    const extReasonsWhyNotOpts = [
      0,
      1,
      2,
      9999
    ];
    resultModel.answers.externalReasonsWhyNot = {
      response: extReasonsWhyNotOpts[Math.floor(Math.random() * extReasonsWhyNotOpts.length)],
      other: ""
    };
    // Fill the other
    if (resultModel.answers.externalReasonsWhyNot.response == 9999) {
      resultModel.answers.externalReasonsWhyNot.other = loremIpsum({ count: 3, units: 'words' });
    }
  }

  // External vendor criteria
  const extVendorCrit = [
    0,
    1,
    2,
    3,
    4,
    5,
    9999
  ];
  resultModel.answers.mostImportantVendorCriteria = { order: [], other: "" };
  while (extVendorCrit.length > 0) {
    resultModel.answers.mostImportantVendorCriteria.order.push(extVendorCrit.splice(Math.floor(Math.random() * extVendorCrit.length), 1)[0]);
  }
  // if "other" is high
  if (resultModel.answers.mostImportantVendorCriteria.order.indexOf(9999) < 3) {
    resultModel.answers.mostImportantVendorCriteria.other = loremIpsum({ count: 3, units: 'words' });
  }

  // How well did the vendor do in each area
  resultModel.answers.howWellInAreas = [
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1
  ];

  // Handle frequency and responsiveness
  resultModel.answers.frequencyRating = Math.random() * 100;
  resultModel.answers.responsivenessRating = Math.random() * 100;

  // Competitor ranking
  const competitorQPossibleAnswers = [];
  for (let i = 0; i < competitorList.length + 2; i++) {
    competitorQPossibleAnswers.push(i);
  }
  competitorQPossibleAnswers.push(9999);
  resultModel.answers.vendorRankings = { order: [], other: "" };
  while (competitorQPossibleAnswers.length > 0) {
    resultModel.answers.vendorRankings.order.push(competitorQPossibleAnswers.splice(Math.floor(Math.random() * competitorQPossibleAnswers.length), 1)[0]);
  }
  // if "other" is high
  if (resultModel.answers.vendorRankings.order.indexOf(9999) < 3) {
    resultModel.answers.vendorRankings.other = faker.company.companyName(); // Company name
  }

  // Reasons why winner was chosen
  const winnerChosenOpts = [
    0,
    1,
    2,
    3,
    4,
    5,
    9999
  ];
  resultModel.answers.reasonsWhyWinnerChosen = {
    responses: [winnerChosenOpts.splice(Math.floor(Math.random() * winnerChosenOpts.length), 1)[0], winnerChosenOpts.splice(Math.floor(Math.random() * winnerChosenOpts.length), 1)[0]],
    other: ""
  };
  // Fill the other
  if (resultModel.answers.reasonsWhyWinnerChosen.responses.indexOf(9999) < 3) {
    resultModel.answers.reasonsWhyWinnerChosen.other = loremIpsum({ count: 3, units: 'words' });
  }

  // Compared to your ideal vendor
  resultModel.answers.rateWinningVendor = [
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1
  ];

  // Add a major player
  resultModel.answers.majorPlayersList = [
    faker.name.firstName() + " " + faker.name.lastName() + ", " + jobTitleList[Math.floor(Math.random() * jobTitleList.length)],
    "",
    "",
    ""
  ];

  // Handle the ratings for the contacts
  for (let i = 0; i < oppContacts.length; i++) {
    resultModel.answers["decisionMaker" + (i + 1) + "Influence"] = Math.random() * 100;
  }

  resultModel.answers["decisionMakerCustom1Influence"] = Math.random() * 100;

  // Reconnect
  resultModel.answers.reconnect = Math.floor(Math.random() * 7) + 1;

  // One piece of advice
  resultModel.answers.onePieceAdvice = loremIpsum({ count: 10, units: 'words' });

  // Not anonymous
  resultModel.answers.anonymity = (Math.random() > 0.8) ? 0 : 1;

  // Spit out the result
  return resultModel.answers;
};

// Expose 
module.exports = { MakeFakeAccount, GenerateDataForAccount };