import React from 'react';
import axios from 'axios';
import buildESQuery from './buildESQuery';
export { buildESQuery };

const esConnect = config => queryObj => Component =>
  class extends React.PureComponent {
    state = {
      esQuery: buildESQuery(queryObj, config),
      results: []
    };

    componentDidMount() {
      if (!this.state.esQuery._error_ && !config.test) {
        console.log(`Sending request to ${this.state.url}!`);
        this.sendQuery();
      }
    }

    sendQuery = () => {
      axios
        .post(config.url, this.state.esQuery)
        .then(res => this.setState({ results: res.data.hits.hits }))
        .catch(err => console.log(`esConnect: Request failed. ${err}`));
    };

    setQuery = newQueryObj => {
      this.setState(
        { esQuery: buildESQuery(newQueryObj, config) },
        () => this.sendQuery
      );
    };

    render() {
      return (
        <Component
          {...this.props}
          results={this.state.results}
          query={this.state.esQuery}
          setQuery={this.setQuery}
        />
      );
    }
  };

export default esConnect;
