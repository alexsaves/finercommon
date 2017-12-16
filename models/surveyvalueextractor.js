/**
 * The types of equality
 */
var EQUALITIES = {
  NOTCONTAINSANY: '!*=',
  NOTLIKE: '!~=',
  GREATERTHANOREQUAL: '>=',
  LESSTHANOREQUAL: '<=',
  EQUAL: '=',
  NOTEQUAL: '!=',
  CONTAINSANY: '*=',
  LIKE: '~=',
  LESSTHAN: '<',
  GREATERTHAN: '>'
};

/**
 * Value Extractor class
 */
const ValExtractor = class {
  /**
   * Set up a new evaluator
   */
  constructor() {}

  /**
   * Get a value from the survey
   * @param {*} surveyValue
   * @param {*} answers
   * @param {*} surveyDef
   * @param {*} variables
   */
  getSurveyQuestionValue(dependentQuestionName, answers, surveyDef, variables) {
    let isOther = false,
      isVariable = false,
      subQuestion = -1,
      ruleStr = dependentQuestionName,
      splitterSymbol = EQUALITIES.EQUAL;

    if (dependentQuestionName.toLowerCase().indexOf('[other]') > -1) {
      isOther = true;
      subQuestion = 9999;
      dependentQuestionName = dependentQuestionName.substr(0, dependentQuestionName.toLowerCase().indexOf('[other]'));
    } else if (dependentQuestionName.indexOf('[') > -1) {
      subQuestion = parseInt(dependentQuestionName.substr(dependentQuestionName.indexOf('[')).replace(/[\[\]]/g, ''));
      dependentQuestionName = dependentQuestionName.substr(0, dependentQuestionName.toLowerCase().indexOf('['));
    }

    if (!dependentQuestionName || dependentQuestionName.length < 1) {
      throw new Error("Invalid question name: " + dependentQuestionName);
    }

    let dependentQuestion = this._locateQuestionObjectForName(dependentQuestionName, surveyDef);

    if (!dependentQuestion) {
      // Maybe we're referencing variables
      if (variables && variables[dependentQuestionName]) {
        isVariable = true;
      }
    }

    if (isVariable) {
      if (!isNaN(parseFloat(variables[dependentQuestionName]))) {
        return this._evaluateRadioLogic({}, variables[dependentQuestionName], ruleStr, splitterSymbol, isOther);
      } else {
        return this._evaluateTextLogic({}, variables[dependentQuestionName], ruleStr, splitterSymbol, isOther);
      }
    } else if (!dependentQuestion) {
      // throw new Error("Could not find question for logic rule. Question name was: "
      // + dependentQuestionName);
      return false;
    } else {
      let answerObject = this._locateAnswerObjectForName(dependentQuestionName, answers);
      switch (dependentQuestion.type) {
        case "rating":
          return answerObject;
        case "checkbox":
          return this._evaluateCheckboxLogic(dependentQuestion, answerObject, ruleStr, splitterSymbol, isOther);
        case "radio":
          return answerObject;
        case "text":
          return this._evaluateTextLogic(dependentQuestion, answerObject, ruleStr, splitterSymbol, isOther);
        case "multitext":
          return this._evaluateMultiTextLogic(dependentQuestion, answerObject, ruleStr, splitterSymbol, isOther, subQuestion);
        case "dropdown":
          return answerObject;
        case "matrixrating":
          return this._evaluateMatrixRatingLogic(dependentQuestion, answerObject, ruleStr, splitterSymbol, isOther, subQuestion);
        case "sort":
          return this._evaluateSortLogic(dependentQuestion, answerObject, ruleStr, splitterSymbol, isOther, subQuestion);
        default:
          throw new Error("Show logic applied to non-compatible question type: " + dependentQuestion.type);
          return false;
      }
    }
  }

  /**
   * Get a question object from a name
   * @param {*} name
   * @param {*} surveyDef
   * @private
   */
  _locateQuestionObjectForName(name, surveyDef) {
    for (let i = 0; i < surveyDef.length; i++) {
      let pg = surveyDef[i];
      if (pg.elements) {
        var result = pg
          .elements
          .find((el) => {
            return el.name == name;
          });
        if (result) {
          return result;
        }
      }
    }
  }

  /**
   * Get an answer object from a name
   * @param {*} name
   * @param {*} surveyDef
   * @private
   */
  _locateAnswerObjectForName(name, answerObject) {
    if (answerObject) {
      return answerObject[name];
    }
  }

  /**
   * Evaluate a specific rule
   * @param {*} logicRule
   * @param {*} answers
   * @param {*} surveyDef
   * @private
   */
  _checkIndividualLogicRule(logicRule, answers, surveyDef, variables) {}

  /**
   * Do a standard numeric range check
   * @param {*} value
   * @param {*} condition
   * @param {*} equality
   */
  _evaluateStandardNumeric(answer) {
    let numAns = parseFloat(answer);
    return isNaN(numAns) ? numAns : null;
  }

  /**
   * Do a standard text check
   * @param {*} value
   * @param {*} condition
   * @param {*} equality
   */
  _evaluateStandardText(answer, condition, equalityExp) {
    condition = (condition || "")
      .trim()
      .toLowerCase();
    answer = ((answer || "") + "")
      .trim()
      .toLowerCase();
    switch (equalityExp) {
      case EQUALITIES.CONTAINSANY:
        return answer && answer
          .trim()
          .length > 0;
      case EQUALITIES.NOTCONTAINSANY:
        return !answer || answer
          .trim()
          .length === 0;
      case EQUALITIES.EQUAL:
        return condition == answer;
      case EQUALITIES.NOTEQUAL:
        return condition != answer;
      case EQUALITIES.LIKE:
        return answer.indexOf(condition) > -1;
      case EQUALITIES.NOTLIKE:
        return answer.indexOf(condition) == -1;
      default:
        throw new Error(LOGICERRORMESSAGES.UNSUPPTYPE);
        break;
    }
  }

  /**
   * Evaluate the show logic for a rating question
   * @param {*} questionDef
   * @param {*} answerObj
   * @param {*} condition
   */
  _evaluateRatingLogic(questionDef, answerObj, condition, equalityExp, isOther)
  {
    if (isOther) {
      throw new Error("Invalid condition for rating. Other not supported.");
    } else {
      let conditionChoice = parseInt(condition);
      return this._evaluateStandardNumeric(answerObj, condition, equalityExp);
    }
  }

  /**
   * Evaluate the show logic for a checkbox question
   * @param {*} questionDef
   * @param {*} answerObj
   * @param {*} condition
   */
  _evaluateCheckboxLogic(questionDef, answerObj, condition, equalityExp, isOther)
  {
    if (isOther && !questionDef.other) {
      throw new Error(LOGICERRORMESSAGES.NOOTHER);
    } else {
      if (isOther) {
        return this._evaluateStandardText(answerObj.other, condition, equalityExp);
      } else {
        let conditionChoice = parseInt(condition),
          hasResp = !!answerObj;
        switch (equalityExp) {
          case EQUALITIES.CONTAINSANY:
            return hasResp;
          case EQUALITIES.NOTCONTAINSANY:
            return !hasResp;
          case EQUALITIES.EQUAL:
            return hasResp && answerObj.responses && answerObj
              .responses
              .indexOf(conditionChoice) > -1;
          case EQUALITIES.NOTEQUAL:
            return !hasResp || (answerObj && answerObj.responses && answerObj.responses.indexOf(conditionChoice) == -1);
          default:
            throw new Error(LOGICERRORMESSAGES.UNSUPPTYPE);
            break;
        }
      }
    }
  }

  /**
   * Evaluate the show logic for a multi-text question
   * @param {*} questionDef
   * @param {*} answerObj
   * @param {*} condition
   */
  _evaluateMultiTextLogic(questionDef, answerObj, condition, equalityExp, isOther, subQuestion)
  {
    if (isOther && !questionDef.other) {
      throw new Error(LOGICERRORMESSAGES.NOOTHER);
    } else {
      if (isOther) {
        return this._evaluateStandardText(answerObj.other, condition, equalityExp);
      } else {
        condition = condition
          .toLowerCase()
          .trim();
        let overallAnswer = ((answerObj && answerObj.length > 0)
          ? answerObj.join(' ')
          : '')
          .trim()
          .toLowerCase();
        switch (equalityExp) {
          case EQUALITIES.CONTAINSANY:
            if (subQuestion == -1) {
              return overallAnswer && overallAnswer.length > 0;
            } else if (answerObj && answerObj.length > 0) {
              return answerObj[subQuestion]
                .trim()
                .length > 0;
            } else {
              return false;
            }
          case EQUALITIES.NOTCONTAINSANY:
            if (subQuestion == -1) {
              return overallAnswer.length === 0;
            } else if (answerObj && answerObj.length === 0) {
              return answerObj[subQuestion]
                .trim()
                .length > 0;
            } else {
              return false;
            }
          case EQUALITIES.EQUAL:
            if (subQuestion == -1) {
              return condition == overallAnswer;
            } else if (answerObj && answerObj.length === 0) {
              return answerObj[subQuestion]
                .trim()
                .toLowerCase() == condition.toLowerCase();
            } else {
              return false;
            }
          case EQUALITIES.NOTEQUAL:
            if (subQuestion == -1) {
              return condition != overallAnswer;
            } else if (answerObj && answerObj.length === 0) {
              return answerObj[subQuestion]
                .trim()
                .toLowerCase() != condition.toLowerCase();
            } else {
              return false;
            }
          case EQUALITIES.LIKE:
            if (subQuestion == -1) {
              return overallAnswer.indexOf(condition) > -1;
            } else if (answerObj && answerObj.length === 0) {
              return answerObj[subQuestion]
                .trim()
                .toLowerCase()
                .indexOf(condition.toLowerCase());
            } else {
              return false;
            }

          case EQUALITIES.NOTLIKE:
            return overallAnswer.indexOf(condition) == -1;
          default:
            throw new Error(LOGICERRORMESSAGES.UNSUPPTYPE);
            break;
        }
      }
    }
  }

  /**
   * Evaluate the show logic for a radio question
   * @param {*} questionDef
   * @param {*} answerObj
   * @param {*} condition
   */
  _evaluateRadioLogic(questionDef, answerObj, condition, equalityExp, isOther)
  {
    if (isOther && !questionDef.other) {
      throw new Error(LOGICERRORMESSAGES.NOOTHER);
    } else {
      if (isOther) {
        return this._evaluateStandardText(answerObj.other, condition, equalityExp);
      } else {
        let conditionChoice = parseInt(condition),
          answerNum = (answerObj && answerObj.response != null && typeof answerObj.response != "undefined")
            ? parseFloat(answerObj.response)
            : null;
        return this._evaluateStandardNumeric(answerNum, condition, equalityExp);
      }
    }
  }

  /**
   * Evaluate the show logic for a text question
   * @param {*} questionDef
   * @param {*} answerObj
   * @param {*} condition
   */
  _evaluateTextLogic(questionDef, answerObj, condition, equalityExp, isOther)
  {
    if (isOther) {
      throw new Error("Invalid condition for text. Other not supported.");
    } else {
      return this._evaluateStandardText(answerObj, condition, equalityExp);
    }
  }

  /**
   * Evaluate the show logic for a dropdown question
   * @param {*} questionDef
   * @param {*} answerObj
   * @param {*} condition
   */
  _evaluateDropdownLogic(questionDef, answerObj, condition, equalityExp, isOther)
  {
    if (isOther) {
      throw new Error("Invalid condition for dropdown. Other not supported.");
    } else {
      let conditionChoice = parseInt(condition);
      return this._evaluateStandardNumeric(answerObj, condition, equalityExp);
    }
  }

  /**
   * Evaluate the show logic for a matrixrating question
   * @param {*} questionDef
   * @param {*} answerObj
   * @param {*} condition
   */
  _evaluateMatrixRatingLogic(questionDef, answerObj, condition, equalityExp, isOther, subQuestion)
  {
    if (isOther) {
      throw new Error("Invalid condition for sort. Other not supported.");
    } else {
      return answerObj && answerObj[subQuestion];
    }
  }

  /**
   * Evaluate the show logic for a sort question
   * @param {*} questionDef
   * @param {*} answerObj
   * @param {*} condition
   */
  _evaluateSortLogic(questionDef, answerObj, condition, equalityExp, isOther, subQuestion)
  {
    if (isOther) {
      if (!questionDef.other) {
        throw new Error("Invalid condition for sort. Other not supported.");
      }
      var order = (answerObj && answerObj.order)
        ? answerObj.order
        : [];
      if (equalityExp == EQUALITIES.CONTAINSANY) {
        return !!answerObj;
      } else if (equalityExp == EQUALITIES.NOTCONTAINSANY) {
        return !!!answerObj;
      }
      if (equalityExp == EQUALITIES.LIKE || equalityExp == EQUALITIES.NOTLIKE) {
        return this._evaluateStandardText(answerObj.other, condition, equalityExp);
      } else {
        subQuestion = 9999;
        var numCond = parseInt(condition);
        switch (equalityExp) {
          case(EQUALITIES.EQUAL):
            if (isNaN(numCond)) {
              return this._evaluateStandardText(answerObj.other, condition, equalityExp);
            }
            return order.indexOf(subQuestion) == numCond;
          case(EQUALITIES.NOTEQUAL):
            if (isNaN(numCond)) {
              return this._evaluateStandardText(answerObj.other, condition, equalityExp);
            }
            return order.indexOf(subQuestion) != numCond;
          case(EQUALITIES.GREATERTHAN):
            return order.indexOf(subQuestion) > numCond;
          case(EQUALITIES.GREATERTHANOREQUAL):
            return order.indexOf(subQuestion) >= numCond;
          case(EQUALITIES.LESSTHAN):
            return order.indexOf(subQuestion) < numCond;
          case(EQUALITIES.LESSTHANOREQUAL):
            return order.indexOf(subQuestion) <= numCond;
          default:
            throw new Error(LOGICERRORMESSAGES.UNSUPPTYPE);
        }
      }
    } else {
      if (subQuestion == -1 || isNaN(subQuestion)) {
        if (equalityExp == EQUALITIES.CONTAINSANY) {
          return !!answerObj;
        } else if (equalityExp == EQUALITIES.NOTCONTAINSANY) {
          return !!!answerObj;
        } else {
          throw new Error(LOGICERRORMESSAGES.UNSUPPTYPE);
        }
      } else {
        var order = (answerObj && answerObj.order)
            ? answerObj.order
            : [],
          numCond = parseInt(condition);
        switch (equalityExp) {
          case(EQUALITIES.EQUAL):
            return !(order.length < (subQuestion - 1)) && order[numCond] == subQuestion;
          case(EQUALITIES.NOTEQUAL):
            return (order.length < (subQuestion - 1)) || order[numCond] != subQuestion;
          case(EQUALITIES.GREATERTHAN):
            return order.indexOf(subQuestion) > numCond;
          case(EQUALITIES.GREATERTHANOREQUAL):
            return order.indexOf(subQuestion) >= numCond;
          case(EQUALITIES.LESSTHAN):
            return order.indexOf(subQuestion) < numCond;
          case(EQUALITIES.LESSTHANOREQUAL):
            return order.indexOf(subQuestion) <= numCond;
          default:
            throw new Error(LOGICERRORMESSAGES.UNSUPPTYPE);
        }
      }
    }
  }
};

/**
 * Show Logic Evaluator
 */
module.exports = ValExtractor;