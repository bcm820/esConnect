export function logQuery(key, result) {
  if (result.error) {
    let errs = `(esConnect) ${result.error}\n`;
    result.errors.forEach(e => (errs += `* ${e}\n`));
    console.error(errs);
  } else console.log('*', key, result);
}

const messages = {
  match: key =>
    `Unable to construct match query for ${key} field since an invalid value was used. Match queries can use strings, integers, boolean values, and dates.`,
  multi: val => {
    return val
      ? `Unable to construct multi-match query for value "${val}". Multi-match queries expect an array of strings specifying at least 2 fields to search across.`
      : `Unable to construct multi-match query since no value was specified following the "?" operator.`;
  },
  qs: key =>
    `Unable to construct query string for "${key}" field. Consider using custom query string syntax (see documentation for more details).`,
  range: key =>
    `Unable to construct range query for "${key}" field. Range queries expect strings starting with "<" or ">", followed by a number.`,
  filter: key => {
    return key
      ? `Unable to construct filter query for "${key}" field. Please make sure to enclose the field name within parentheses to specify a valid filter context.`
      : `Unable to construct filter query since no field name was specified within the parentheses.`;
  }
};

export function getErrorObj(type, key, errors) {
  return {
    error: messages[type](key),
    errors
  };
}
