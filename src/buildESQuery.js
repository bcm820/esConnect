import selectQueryMethod from './queries';
import { logQuery, getErrorObj } from './utils';

/**
 * Builds an Elasticsearch query object to be sent to an ES cluster.
 * @param {any} queryObj
 * @param {any} config
 * @returns
 */
function buildESQuery(queryObj, config = {}) {
  const fields = Object.keys(queryObj);
  const esQuery = {};
  const query = { bool: {} };

  let hasQueries = false;

  // Build must/should query array for matching documents
  const include = fields
    .filter(key => key[0] !== '!' && key[0] !== '(')
    .map(key => {
      const result = selectQueryMethod(key, queryObj[key]);
      if (result.error) esQuery._error_ = true;
      if (config.log) logQuery(key, result);
      return result;
    })
    .filter(obj => !obj.error);

  // Build must_not query array for excluding documents
  const exclude = fields
    .filter(key => key[0] === '!' && key[0] !== '(')
    .map(key => {
      const result = selectQueryMethod(key.substring(1), queryObj[key]);
      if (result.error) esQuery._error_ = true;
      if (config.log) logQuery(key, result);
      return result;
    })
    .filter(obj => !obj.error);

  // Build filter query array for filtering out docs
  const filter = fields
    .filter(key => key[0] === '(')
    .map(key => {
      let result;
      const field = key.substring(1, key.length - 1);
      if (key[key.length - 1] !== ')') result = getErrorObj('filter', key, []);
      else if (!field.length) result = getErrorObj('filter', null, []);
      else result = selectQueryMethod(field, queryObj[key]);
      if (result.error) esQuery._error_ = true;
      if (config.log) logQuery(key, result);
      return result;
    })
    .filter(obj => !obj.error);

  // If there are 'must' queries, store them.
  // If config.match is set, validate it, storing error status.
  // If the amount is valid, store 'should' queries with the match amount.
  if (include.length && (!config.match || config.match === fields.length)) {
    query.bool.must = include;
    hasQueries = true;
  } else if (config.match && typeof config.match !== 'number') {
    esQuery._error_ = true;
    console.error(
      "(esConnect) Uncaught TypeError: 'config.match' is not a number"
    );
  } else {
    if ((config.match > 0 && !fields.length) || config.match > fields.length) {
      esQuery._error_ = true;
      console.error("(esConnect) Error: 'config.match' exceeds query amount.");
    } else if (include.length) {
      query.bool.should = include;
      query.bool.minimum_should_match = config.match;
      hasQueries = true;
    }
  }

  // if must_not queries are stored, store in bool query object
  if (exclude.length) {
    query.bool.must_not = exclude;
    hasQueries = true;
  }

  // if filter queries are stored, store in bool query object
  if (filter.length) {
    query.bool.filter = filter;
    hasQueries = true;
  }

  // If there are queries, add query field to esQuery
  if (hasQueries) esQuery.query = query;

  if (!hasQueries) {
    console.error('(esConnect) Error: No valid queries were provided.');
  }

  // Add size param if specified
  if (config.size) esQuery.size = config.size;

  // Add sort param if specified
  if (config.sortBy)
    esQuery.sort = {
      [config.sortBy.replace('^', '')]: {
        order: config.sortBy.includes('^') ? 'asc' : 'desc'
      }
    };

  // log final error
  if (esQuery._error_) {
    let finalError = `(esConnect) One or more errors were found. No request was sent.`;
    if (!config.log)
      finalError += ` Update "log" setting in esConnect config object to "true" to view error details.`;
    console.error(finalError);
  }

  return esQuery;
}

export default buildESQuery;
