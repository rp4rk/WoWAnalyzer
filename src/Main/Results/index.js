import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import Masonry from 'react-masonry-component';
import Textfit from 'react-textfit';

import ChecklistIcon from 'Icons/Checklist';
import SuggestionIcon from 'Icons/Suggestion';
import ArmorIcon from 'Icons/Armor';
import Wrapper from 'common/Wrapper';
import ReadableList from 'common/ReadableList';
import { getResultTab } from 'selectors/url/report';
import DevelopmentTab from 'Main/DevelopmentTab';
import EventsTab from 'Main/EventsTab';
import Tab from 'Main/Tab';
import Status from 'Main/Status';
import SuggestionsTab from 'Main/SuggestionsTab';
import ActivityIndicator from 'Main/ActivityIndicator';
import WarcraftLogsLogo from 'Main/Images/WarcraftLogs-logo.png';
import WipefestLogo from 'Main/Images/Wipefest-logo.png';
import Maintainer from 'Main/Maintainer';

import ItemsPanel from './ItemsPanel';
import ResultsWarning from './ResultsWarning';
import Header from './Header';

import './Results.css';

const MAIN_TAB = {
  CHECKLIST: 'Checklist',
  SUGGESTIONS: 'Suggestions',
  CHARACTER: 'Character',
};
function mainTabLabel(tab) {
  switch (tab) {
    case MAIN_TAB.CHECKLIST:
      return (
        <Wrapper>
          <ChecklistIcon /> Checklist
        </Wrapper>
      );
    case MAIN_TAB.SUGGESTIONS:
      return (
        <Wrapper>
          <SuggestionIcon /> Suggestions
        </Wrapper>
      );
    case MAIN_TAB.CHARACTER:
      return (
        <Wrapper>
          <ArmorIcon /> CHARACTER
          </Wrapper>
        );
    default: return tab;
  }
}

class Results extends React.Component {
  static childContextTypes = {
    updateResults: PropTypes.func.isRequired,
    parser: PropTypes.object.isRequired,
  };
  getChildContext() {
    return {
      updateResults: this.forceUpdate.bind(this),
      parser: this.props.parser,
    };
  }
  static contextTypes = {
    config: PropTypes.object.isRequired,
  };
  static propTypes = {
    parser: PropTypes.object.isRequired,
    tab: PropTypes.string,
    onChangeTab: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      mainTab: props.parser._modules.checklist.rules.length === 0 ? MAIN_TAB.SUGGESTIONS : MAIN_TAB.CHECKLIST,
    };
  }

  componentDidUpdate() {
    ReactTooltip.rebuild();
  }

  renderStatistics(statistics) {
    return (
      <Masonry className="row statistics">
        {statistics
          .filter(statistic => !!statistic) // filter optionals
          .map((statistic, index) => statistic.statistic ? statistic : { statistic, order: index }) // normalize
          .sort((a, b) => a.order - b.order)
          .map((statistic, i) => React.cloneElement(statistic.statistic, {
            key: `${statistic.order}-${i}`,
          }))}
      </Masonry>
    );
  }

  get warning() {
    const parser = this.props.parser;
    const boss = parser.boss;
    if (boss && boss.fight.resultsWarning) {
      return boss.fight.resultsWarning;
    }
    if (parser.feedbackWarning) {
      return 'This spec is believed to be complete, but needs additional feedback. If there is something missing, incorrect, or inaccurate, please contact this specs maintainer so it can be fixed before being marked as "Good".';
    }
    return null;
  }

  render() {
    const { parser, tab, onChangeTab } = this.props;
    const report = parser.report;
    const fight = parser.fight;
    const config = this.context.config;
    const modules = parser._modules;
    const selectedCombatant = modules.combatants.selected;
    if (!selectedCombatant) {
      return (
        <div>
          <div className="back-button">
            <Link to={`/report/${report.code}/${fight.id}`} data-tip="Back to player selection">
              <span className="glyphicon glyphicon-chevron-left" aria-hidden />
            </Link>
          </div>
          <ActivityIndicator text="Fetching players..." />
        </div>
      );
    }

    const results = parser.generateResults();

    if (process.env.NODE_ENV === 'development') {
      results.tabs.push({
        title: 'Development',
        url: 'development',
        order: 100000,
        render: () => (
          <DevelopmentTab
            parser={parser}
            results={results}
          />
        ),
      });
      results.tabs.push({
        title: 'Events',
        url: 'events',
        order: 100001,
        render: () => (
          <EventsTab
            parser={parser}
          />
        ),
      });
      results.tabs.push({
        title: 'Status',
        url: 'status',
        order: 100002,
        render: () => (
          <Tab title="Status" style={{ padding: '15px 22px' }}>
            <Status />
          </Tab>
        ),
      });
    }

    const tabUrl = tab || results.tabs[0].url;
    const activeTab = results.tabs.find(tab => tab.url === tabUrl) || results.tabs[0];
    const { spec, description, maintainers } = this.context.config;

    return (
      <div className="container">
        <div className="results">
          <Header config={config} playerName={selectedCombatant.name} boss={parser.boss} fight={fight} />

          <div className="row">
            <div className="col-md-4">
              <div className="panel items">
                <div className="panel-heading">
                  <h2>About {spec.specName} {spec.className}</h2>
                </div>
                <div className="panel-body">
                  {description}

                  <div style={{ marginTop: '1em' }}>
                    <ReadableList>
                      {maintainers.map(maintainer => <Maintainer key={maintainer.nickname} {...maintainer} />)}
                    </ReadableList>{' '}
                    {maintainers.length > 2 && 'all'} worked on {spec.specName} {spec.className}. If you have any feedback please let us know on <a href="https://discord.gg/AxphPxU">Discord</a>, and <dfn title="Pun intended">check out</dfn>{/*ok so I did title instead of data-tip by accident but then decided to stick with it so it doesn't attract attention since the title version isn't styled*/} <a href="https://github.com/WoWAnalyzer/WoWAnalyzer">GitHub</a> for the source of the analysis and information on how to contribute.
                  </div>
                </div>
              </div>

              <ItemsPanel items={results.items} selectedCombatant={selectedCombatant} />

              <div>
                <a
                  href={`https://www.warcraftlogs.com/reports/${report.code}/#fight=${fight.id}&source=${parser.playerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ fontSize: 24 }}
                  data-tip="View the original report"
                >
                  <img src={WarcraftLogsLogo} alt="Warcraft Logs logo" style={{ height: '1.4em', marginTop: '-0.15em' }} /> Warcraft Logs
                </a>
                {' '}
                <a
                  href={`https://www.wipefest.net/report/${report.code}/fight/${fight.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ fontSize: 24 }}
                  data-tip="View insights and timelines for raid encounters"
                >
                  <img src={WipefestLogo} alt="Wipefest logo" style={{ height: '1.4em', marginTop: '-0.15em' }} /> Wipefest
                </a>
              </div>
            </div>
            <div className="col-md-8">
              <div className="panel tabbed">
                <div className="panel-body flex" style={{ flexDirection: 'column', padding: '0' }}>
                  <div className="navigation item-divider">
                    <div className="flex" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {Object.values(MAIN_TAB).map(tab => (
                        <button
                          key={tab}
                          className={this.state.mainTab === tab ? 'btn-link selected' : 'btn-link'}
                          onClick={() => {
                            this.setState({
                              mainTab: tab,
                            });
                          }}
                        >
                          {mainTabLabel(tab)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <ResultsWarning warning={this.warning} />
                    {this.state.mainTab === MAIN_TAB.CHECKLIST && (
                      modules.checklist.render()
                    )}
                    {this.state.mainTab === MAIN_TAB.SUGGESTIONS && (
                      <SuggestionsTab issues={results.issues} />
                    )}
                    {this.state.mainTab === MAIN_TAB.CHARACTER && (
                      modules.characterPanel.render()
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="row">
            <div className="col-md-6">
              <div className="row">
                <div className="col-md-4">
                  <div style={{ border: '7px solid #fff', background: 'rgba(0, 0, 0, 0.4)', padding: '8px 14px', fontSize: 40, fontWeight: 700, lineHeight: 1.1 }}>
                    <Textfit mode="single" max={40}>
                    How It's<br />
                    Made
                    </Textfit>
                  </div>
                </div>
                <div className="col-md-8" style={{ fontSize: 20 }}>
                  Curious how we're doing the analysis? Want to change something? You can find this spec's source <a href={`https://github.com/WoWAnalyzer/WoWAnalyzer/tree/master/${config.path}`}>here</a> and a guide on contributing <a href="https://github.com/WoWAnalyzer/WoWAnalyzer/tree/master/docs#contributing">here</a>.
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="row">
                <div className="col-md-4">
                  <div style={{ border: '7px solid #fff', background: 'rgba(0, 0, 0, 0.4)', padding: '8px 14px', fontSize: 40, fontWeight: 700, lineHeight: 1.1 }}>
                    <Textfit mode="single" max={40}>
                      Feedback<br />
                      Welcome
                    </Textfit>
                  </div>
                </div>
                <div className="col-md-8" style={{ fontSize: 20 }}>
                  Do you have a really cool idea? Is a suggestion or checklist threshold off? Spotted a bug? Let us know on <a href="https://discord.gg/AxphPxU">Discord</a>.
                </div>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="row">
            <div className="col-md-12">
              {this.renderStatistics(results.statistics)}
            </div>
          </div>

          <div className="divider" />

          <div className="panel tabbed" style={{ marginTop: 15, marginBottom: 100 }}>
            <div className="panel-body flex" style={{ flexDirection: 'column', padding: '0' }}>
              <div className="navigation item-divider">
                <div className="flex" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {results.tabs
                    .sort((a, b) => {
                      const aOrder = a.order !== undefined ? a.order : 100;
                      const bOrder = b.order !== undefined ? b.order : 100;

                      return aOrder - bOrder;
                    })
                    .map(tab => (
                      <button
                        key={tab.title}
                        className={activeTab.url === tab.url ? 'btn-link selected' : 'btn-link'}
                        onClick={() => onChangeTab(tab.url)}
                      >
                        {tab.title}
                      </button>
                    ))}
                </div>
              </div>
              <div>
                {activeTab.render()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  tab: getResultTab(state),
});

export default connect(
  mapStateToProps
)(Results);
