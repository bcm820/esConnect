# esConnect

esConnect is a highly-configurable Javascript utility created to ease the burden of making detailed query requests to Elasticsearch cluster endpoints.

What it lacks in features when compared to other Elasticsearch query builders such as [bodybuilder](https://github.com/danpaz/bodybuilder) and [elastic-builder](https://github.com/sudo-suhas/elastic-builder), it makes up for in conciseness of syntax and composability.

To import (after it is made available as an NPM module):
```
import {buildESQuery} from 'esConnect';
```
See "[Interoperability](#interoperability)" for instructions on importing as a React higher order component.

## Basic Example
[bool]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-query.html

Using esConnect to access indexed Elasticsearch data for use in an application is as easy as passing a simple, single-depth object with search parameters and an optional configuration object into a function:

```
buildESQuery({
  bike_type: 'hybrid',
  size: '< 56',
  uses: ['commute', 'city']
}, configObj);
```

`buildESQuery` returns an Elasticsearch-ready [bool query object][bool]:

```
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "bike_type": "hybrid"
          }
        },
        {
          "query": {
            "range": {
              "size": {
                "lt": 56
              }
            }
          }
        },
        {
          "query_string": {
            "query": "commute OR city",
            "default_field": "uses",
            "analyze_wildcard": false,
            "fuzziness": 0
          }
        }
      ]
    }
  }
}
```

## Query Types

Many complex searches can be achieved using Elasticsearch's [bool query][bool] which combines the results of individual queries. By default, esConnect tells Elasticsearch to find search results that match all of its parameters, although that is [configurable via the `match` option](#configuration) as well as [various modifiers](#modiifers).

[match]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-query.html
[range]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-range-query.html
[mm]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html
[qs]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html

| TYPE               | RESULTS RETURNED                                                                                  | EXAMPLE USAGE                                  |
| ------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [Match][match]     | Most relevant results for a given field's value.                                                  | `bike_type: 'road'`                            |
| [Range][range]     | Results with a field's value less than (`<`) _or_ greater than (`>`) a given amount.              | `ship_date: '<' + Date`                        |
|                    | Results with a given field's value less than AND greater than the given amounts.                  | `price: ['< 800', '> 400']`                    |
| [Multi-match][mm]  | Prepend the key with "?" to search for relevant results for a given value across multiple fields. | `'?skinny tires': ['description', 'keywords']` |
| [Query string][qs] | Most relevant results for a given field matching at least one value.                              | `frame: ['carbon', 'aluminum']`                |
|                    | Results matching Elasticsearch's custom query string query syntax.                                | `colors: '(black OR gray) AND red'`            |

## Modifiers

[filter]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html#_scoring_with_literal_bool_filter_literal

| TYPE             | DESCRIPTION                                                                                         | EXAMPLE USAGE                |
| ---------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- |
| [Filter][filter] | Enclose the field in parentheses to restrict results to documents that exactly match a given value. | `'(condition)': 'brand new'` |
| [Exclude][bool]  | Prepend the key with "!" to exclude results that match the query.                                   | `!price': '> 1000`,          |

## Operators

The [query string query][qs] is a natural option for most cases due to its customizability. By default, building a query string query via esConnect by adding multiple values to an array tells Elasticsearch to find documents that match at least one of the values in the array. However, several different operators may be used to change the default behavior. While more nuanced query string queries may require using Elasticsearch's custom query string syntax, you may find the array approach helpful for your own use case (for example, when receiving multiple user inputs).

| OPERATOR | DESCRIPTION                                                                              | EXAMPLE USAGE                                  |
| -------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `&`      | Links to the previous value in the array to require results to match both (i.e. `AND`).  | `uses: ['race', '&joyride']`                   |
| `~`      | Accounts for minor misspellings for a specific value, finding matches anwyay.            | `brand: ['Specialized~']`                      |
| `*`      | Specifies wildcards before or after values, finding matches that start/end with a value. | `model: ['Ta*']`                               |
| `^`      | Boosts the relevancy (i.e. priority) of a specific value with a multiplier.              | `availability: [`"in stock"^2`, 'shipping^1']` |

# Configuration

An optional configuration object can be passed in as a second argument to `buildESQuery`.

| KEY      | VALUE TYPE | DESCRIPTION                                                                                         |
| -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `size`   | Integer    | Specify the maximum amount of results to return.                                                    |
| `match`  | Integer    | Specify the minimum amount of queries a result should match (all if left blank).                    |
| `sortBy` | String     | Sort results by a specific date, number or keyword field, appending "^" to sort in ascending order. |

# Interoperability

While esConnect can be used for forming and sending Elasticsearch queries via a basic HTTP request, it is also meant to be interoperable with other modules.

## As a React HOC

Since the UI developers at [Decipher Technology Studios](https://github.com/DecipherNow) build all our products and solutions using [React](https://reactjs.org), I've initially implemented esConnect as a [React higher order component](https://reactjs.org/docs/higher-order-components.html) (HOC).

To import:
```
import esConnect from 'esConnect';
```
Example usage:
```
const esConnectWithConfig = esConnect(config);
const esConnectWithQuery = esConnectWithConfig(query);
export default esConnectWithQuery(MyComponent);
```

The configuration object requires only an Elasticsearch URL endpoint, but other options for testing and logging are available as well.

| KEY    | VALUE TYPE | DESCRIPTION                                                                                                                       |
| ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `url`  | String     | The endpoint to send the query object to.                                                                                         |
| `log`  | Boolean    | Logs each constructed Elasticsearch query object to the console, or any errors that occurred with suggestions for resolving bugs. |
| `test` | Boolean    | Runs esConnect in "test mode" (does not send a network request).                                                                  |

## With elasticsearch.js

To use with ElasticSearch's official Javascript client, [elasticsearch.js](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-search), simply call `buildESQuery` as follows in the object given to its `search` method:
```
client.search({
  index: 'myindex',
  body: buildESQuery(query, config)
});
```

## With ReactiveSearch

To use with [ReactiveSearch](https://opensource.appbase.io/reactive-manual/advanced/customquery.html), a React component library, simply pass a function that calls `buildESQuery` as follows into the `customQuery` prop. For example:
```
<DataSearch
  ...
  customQuery={() => buildESQuery(query, config)}
/>
```

## Future Plans

I plan on making esConnect available via React's [Context API](https://reactjs.org/docs/context.html) in the near future.

I am also considering an [Angular 2](https://angular.io) implementation, which may involve rewriting esConnect in Typescript (which is probably a good idea considering all the manual typechecking and exception handling in the current codebase).