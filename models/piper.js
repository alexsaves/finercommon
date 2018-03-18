/**
 * Answer piping
 */
const Piper = class {
  /**
   * Set up a new piper
   */
  constructor() {
    this.pipeMatch = /\$\{([\^@\.\[\]a-zA-Z0-9_]*)\}/g;
    this.quickMatch = {};
  }

  /**
   * Get the question definition from the survey
   * @param {*} survey
   * @param {*} questionName
   */
  _getQuestionDefFromSurvey(survey, questionName) {
    let existing = this.quickMatch[questionName];
    if (existing) {
      return existing;
    }
    for (let i = 0; i < survey.length; i++) {
      for (let j = 0; j < survey[i].elements.length; j++) {
        if (survey[i].elements[j].name == questionName) {
          this.quickMatch[questionName] = survey[i].elements[j];
          return survey[i].elements[j];
        }
      }
    }
  }

  /**
   * Get the question definition from the survey
   * @param {*} survey
   * @param {*} questionName
   */
  _getAnswerFromKeyName(questionDef, answers, questionName) {
    if (answers && answers[questionName]) {
      return answers[questionName];
    }
  }

  /**
   * Handle all the question-type specific work and get the final answer
   * @param {*} questionDef
   * @param {*} answer
   * @param {*} questionName
   */
  _parseAnswer(questionDef, answer, questionName, isOther, subQuestion, meta) {
    switch (questionDef.type) {
      case "text":
        if (isOther) {
          throw new Error("Other is not supported in piping for text questions.");
        }
        return answer.trim();
      case "multitext":
        if (isOther) {
          throw new Error("Other is not supported in piping for text questions.");
        } else {
          if (!answer || answer.length <= subQuestion) {
            return "";
          }
          return answer[subQuestion].trim();
        }
      case "rating":
        if (isOther) {
          throw new Error("Other is not supported in piping for rating questions.");
        }
        let modifier = questionDef.modifier || "buttons";
        switch (modifier) {
          case "buttons":
            return answer;
          case "stars":
            return answer;
          case "slider":
            return Math.round(answer) + '%';
          default:
            throw new Error("Pipine error. Unknown rating modifier: " + modifier);
        }
      case "radio":
        if (isOther) {
          return answer.other || (meta && meta.otherDefaultValue);
        }
        return questionDef.choices[answer.response];
      case "dropdown":
        return questionDef.choices[answer];
      case "checkbox":
        if (!isOther) {
          throw new Error("You can only pipe from \"other\" on checkbox questions.");
        } else {
          return answer.other || (meta && meta.otherDefaultValue);
        }
      case "sort":
        if (isOther) {
          return answer.other || (meta && meta.otherDefaultValue);
        } else {
          let whatsinposition = answer.order[subQuestion];
          if (whatsinposition == 9999) {
            // other
            return answer.other || (meta && meta.otherDefaultValue);
          } else {
            return questionDef.choices[whatsinposition];
          }
        }
      case "matrixrating":
        if (isOther) {
          throw new Error("Other is not supported in piping for matrix rating questions.");
        } else {
          let arrcopy = [],
            which = 0;
          answer.forEach((el) => {
            let adjustedScore = (el == -1)
              ? 99999
              : el;
            let choiceName = questionDef.choices[which];
            arrcopy[which++] = {
              label: choiceName,
              score: adjustedScore
            };
          });
          arrcopy = arrcopy.sort((ch1, ch2) => {
            return ch1.score < ch2.score;
          });
          let thechoice = arrcopy[Math.min(arrcopy.length - 1, Math.max(subQuestion, 0))];
          return thechoice.label;
        }
      default:
        throw new Error("Question type " + questionDef.type + " not supported for piping.");
    }
  }

  /**
   * Capitalize the first letter of each word
   * @param {*} str
   */
  _capitalizeFirstLetters(str) {
    return str
      .toLowerCase()
      .replace(/^\w|\s\w/g, function (letter) {
        return letter.toUpperCase();
      })
  }

  /**
   * Run piping on answers and some text
   * @param {*} text
   * @param {*} answers
   */
  _pipe(text, answers, survey, variables, meta) {
    if (arguments.length != 5 || !meta) {
      throw new Error("Piper called with incorrect number of arguments.");
    }
    /*if (text.indexOf('feature1') > -1) {
      debugger;
    }*/
    text = text.replace(this.pipeMatch, (match, questionName, position) => {
      let capitalize = false,
        lowercaseize = false;
      if (questionName.substr(0, 1) == "^") {
        questionName = questionName.substr(1);
        capitalize = true;
      }
      if (questionName.substr(0, 1) == ".") {
        questionName = questionName.substr(1);
        lowercaseize = true;
        capitalize = false;
      }
      let doWordPosition = false,
        wordPosition = -1;
      if (questionName.indexOf('@') > -1) {
        wordPosition = parseInt(questionName.substr(questionName.indexOf('@') + 1));
        if (isNaN(wordPosition)) {
          throw new Error("Had trouble parsing piping rule: " + questionName);
        }
        doWordPosition = true;
        questionName = questionName.substr(0, questionName.indexOf('@'));
      }
      let isOther = false,
        subQuestion = -1;

      if (questionName.toLowerCase().indexOf('[other]') > -1) {
        isOther = true;
        subQuestion = 9999;
        questionName = questionName.substr(0, questionName.toLowerCase().indexOf('[other]'));
      } else if (questionName.indexOf('[') > -1) {
        subQuestion = parseInt(questionName.substr(questionName.indexOf('[')).replace(/[\[\]]/g, ''));
        questionName = questionName.substr(0, questionName.toLowerCase().indexOf('['));
      }

      if (variables && variables[questionName]) {
        var finalval = (variables[questionName] + '').trim();
        if (capitalize) {
          finalval = this._capitalizeFirstLetters(finalval);
        }
        if (lowercaseize) {
          finalval = finalval.toLowerCase();
        }
        if (doWordPosition) {
          let bits = finalval.split(' ');
          finalval = bits[Math.min(wordPosition, bits.length - 1)] || "";
        }
        return finalval;
      } else {
        let q = this._getQuestionDefFromSurvey(survey, questionName);
        if (q) {
          let a = this._getAnswerFromKeyName(q, answers, questionName);
          if (a) {
            let fres = this._parseAnswer(q, a, questionName, isOther, subQuestion, meta);            
            fres = fres.toString();

            if (fres != null && typeof fres != 'undefined') {
              fres = fres.trim();
              if (capitalize) {
                fres = this._capitalizeFirstLetters(fres);
              }
              if (lowercaseize) {
                fres = fres.toLowerCase();
              }
              if (doWordPosition) {
                let bits = fres.split(' ');
                fres = bits[Math.min(wordPosition, bits.length - 1)] || "";
              }
              return fres;
            }
          }
          return "";
        }
      }
      return "";
    });

    return text;
  }

  /**
   * Run piping on answers and some text
   * @param {*} text
   * @param {*} answers
   */
  pipe(text, answers, survey, variables, meta) {
    var result = this
      ._pipe
      .apply(this, arguments);
    if (result.indexOf('${') > -1) {
      return this.pipe(result, answers, survey, variables, meta);
    }
    return result;
  }

};

// Expose the class
module.exports = Piper;