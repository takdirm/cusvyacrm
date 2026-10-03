// Fix property shorthand (lines 12, 13, 50)
// Change from:
const obj = {
  scriptType: scriptType,
  releaseType: releaseType,
  someProperty: someProperty,
};

// To:
const obj = {
  scriptType,
  releaseType,
  someProperty,
};

// Fix string concatenation (line 144)
// Change from:
const url = API.Planner.path + '/searchable-plan?commandname=' + commandName;

// To:
const url = `${API.Planner.path}/searchable-plan?commandname=${commandName}`;
