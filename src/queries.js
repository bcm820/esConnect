import { getErrorObj } from './utils';

/**
 * Returns appropriate query based on the value provided.
 * Receives a string or an ar
 * @param string key
 * @param {any} value
 * @returns a type of query
 */
function selectQueryMethod(key, value) {
  if (typeof value === 'string') {
    if (value[0].match(/(<|>)/g)) return range(key, [value]);
    else if (value.includes(' ')) return queryString(key, value);
    else return match(key, value);
  } else if (Array.isArray(value)) {
    if (key[0] === '?') return matchFields(key, value);
    else if (typeof value[0] === 'string' && value[0][0].match(/(<|>)/g))
      return range(key, value);
    else return queryString(key, value);
  } else return match(key, value);
}

export default selectQueryMethod;

/**
 * Returns a query that finds matches from one field
 * For single values (string, number, bool, date)
 * @param {any} key
 * @param {any} value
 * @returns a type of query
 */
function match(key, value) {
  if (!value)
    return getErrorObj('match', key, [`Invalid argument: ${typeof val}`]);
  return { match: { [key]: value } };
}

/**
 * Returns a query that matches from many fields
 * Only works with strings or numbers for now
 * @param {any} key
 * @param {any} fields
 * @returns a type of query
 */
function matchFields(value, fields) {
  value = value.substring(1);
  if (fields.length < 2) return getErrorObj('multi', value, []);
  if (!value) return getErrorObj('multi', null, []);
  const query = isNaN(value) ? value : parseInt(value, 10);
  return {
    multi_match: {
      query,
      fields,
      type: 'best_fields',
      operator: 'or'
    }
  };
}

/**
 * Returns a query that matches many values in a field
 * using operators such as AND and OR
 * with various modifiers (fuzziness, wildcards)
 * @param {any} key
 * @param {any} value
 * @returns a type of query
 */
function queryString(key, valueObj) {
  const errors = [];
  const tryToParseQueryString = (val, idx) => {
    try {
      return parseQueryString(val, idx);
    } catch (e) {
      errors.push(`Invalid argument: ${typeof val}`);
      return '';
    }
  };
  const query =
    typeof valueObj === 'string'
      ? valueObj
      : valueObj.map(tryToParseQueryString).join(' ');
  if (errors.length) return getErrorObj('qs', key, errors);
  return {
    query_string: {
      query,
      default_field: key,
      analyze_wildcard: query.includes('*'),
      fuzziness: query.includes('~') ? 'auto' : 0
    }
  };
}

/**
 * Evaluates each value within an array passed into queryString
 * @param {any} key
 * @param {any} value
 * @returns a type of query
 */
function parseQueryString(val, idx) {
  if (typeof val === 'string') {
    if (idx === 0) {
      if (val[0] === '&') return val.substring(1).trim();
      else return val;
    } else if (val[0] === '&') return `AND ${val.substring(1).trim()}`;
    else return `OR ${val}`;
  } else {
    return `OR ${val.toString()}`;
  }
}

/**
 * Returns a query that matches a range of values in a field
 * Works for numbers and dates.
 * @param {any} key
 * @param {any} values
 * @returns a type of query
 */
function range(key, values) {
  const range = {};
  const errors = [];
  values.forEach(value => {
    const isUnemptyRangeString = value[0].match(/(<|>)/g) && value[1];
    const rangeString = value.substring(1).trim();
    const asDate = new Date(rangeString);
    const isValidDate = asDate instanceof Date && !isNaN(asDate);
    if (isUnemptyRangeString && !isNaN(rangeString)) {
      const num = parseInt(rangeString, 10);
      value[0] === '<' ? (range.lt = num) : (range.gt = num);
    } else if (isUnemptyRangeString && isValidDate) {
      value[0] === '<' ? (range.lt = asDate) : (range.gt = asDate);
    } else errors.push(`Invalid argument: "${value}"`);
  });
  if (errors.length) return getErrorObj('range', key, errors);
  return {
    query: {
      range: {
        [key]: range
      }
    }
  };
}
