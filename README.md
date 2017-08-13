# finercommon

Some general information on survey models:

## Survey JSON Models

The schema generally follows the schema of SurveyJS but deviates in several ways.

### Show Logic

Show logic applies to questions or pages and can be singular (just one rule) additive (all statements must be true) or inclusive (any statement must be true). Rules are specified with the optional `showIf` attribute which can be a string (for singular rules), an array (for additive rules), or an object (for inclusive rules).

Rules may generally only apply to questions on pages that appeared earlier in the page sequence.

#### Singular Rules

Here is an example of a single rule, applying to previous question `question8393n4` that the user selected the *2nd* (zero based) option, OR rated (in the case of rating or sort question types) it 2nd.

```
{
    "type": "rating",
    "modifier": "slider",
    "name": "question335933",
    "title": "OK, you said 2. How good is that restaurant?",
    "instructions": "Rate it from low to high.",
    "showIf": "questio8393n4=1"
}
```
#### Additive Rules

Here is an example of an additive rule (all statements must be true), applying to previous question `question8393n4` that the user selected *both* *Apple* (the 2nd item) _and_ *Pear* (the 4th item).

```
{
    "type": "rating",
    "modifier": "slider",
    "name": "question335933",
    "title": "You said apple and pear. How much do you like them?",
    "instructions": "Rate it from low to high.",
    "showIf": [
      "questio8393n4=1",
      "questio8393n4=4"
    ]
}
```

#### Inclusive Rules

Here is an example of an inclusive rule, applying to previous question `question8393n4` that the user selected either *Apple* (the 2nd item) or *Pear* (the 4th item).

```
{
    "type": "rating",
    "modifier": "slider",
    "name": "question335933",
    "title": "You said apple OR pear. How much do you like them?",
    "instructions": "Rate it from low to high.",
    "showIf": {
      "choseApple": "questio8393n4=1",
      "chosePear": "question8393n4=3"
    }
}
```