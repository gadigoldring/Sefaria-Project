const React                  = require('react');
const PropTypes              = require('prop-types');
const Sefaria                = require('./sefaria/sefaria');
const SidebarVersion         = require('./SidebarVersion');
const TextRange              = require('./TextRange');
const { LoadingMessage }     = require('./Misc');
const { RecentFilterSet } = require('./ConnectionFilters');
import Component             from 'react-class';

class VersionsBox extends Component {
  openVersion(v) {
    //v: version object as received from sefaria versions api
    //request v.versionTitle for srefs
    this.props.setConnectionsMode("Version Open");
    this.props.setFilter(v.versionTitle);
  }
  selectVersion(v) {

  }
  renderModeVersions() {
    const versionLangMap = {};
    for (let v of this.props.versions) {
      const matches = v.versionTitle.match(new RegExp("\\[([a-z]{2})\\]$")); // two-letter ISO language code
      const lang = matches ? matches[1] : v.language;
      versionLangMap[lang] = !!versionLangMap[lang] ? versionLangMap[lang].concat(v) : [v];
    }

    //sort versions by language so that
    //- mainVersionLanguage shows up first
    //- standard_langs show up second
    //- everything else shows up in alphabetical order
    const standard_langs = ["en", "he"];
    const versionLangs = Object.keys(versionLangMap).sort(
      (a, b) => {
        if      (a === this.props.mainVersionLanguage.slice(0,2)) {return -1;}
        else if (b === this.props.mainVersionLanguage.slice(0,2)) {return  1;}
        else if (a in standard_langs && !(b in standard_langs))   {return -1;}
        else if (b in standard_langs && !(a in standard_langs))   {return  1;}
        else if (a < b)                                           {return -1;}
        else if (b > a)                                           {return  1;}
        else                                                      {return  0;}
      }
    );
    return (
      <div className="versionsBox">
        {
          versionLangs.map((lang) => (
            <div key={lang}>
              <div className="versionLanguage">{this.props.translateISOLanguageCode(lang)}<span className="versionCount">{` (${versionLangMap[lang].length})`}</span></div>
              {
                versionLangMap[lang].map((v) => (
                  <SidebarVersion
                    version={v}
                    srefs={this.props.srefs}
                    getLicenseMap={this.props.getLicenseMap}
                    key={v.versionTitle + lang}
                    selectVersion={this.selectVersion}
                    openVersion={this.openVersion}
                    isCurrent={(this.props.enVersion && this.props.enVersion.versionTitle === v.versionTitle) ||
                              (this.props.heVersion && this.props.heVersion.versionTitle === v.versionTitle)}
                  />
                ))
              }
            </div>
          ))
        }
      </div>
    );
  }
  renderModeSelected() {
    return (
      <VersionsTextList
        srefs={this.props.srefs}
        vFilter={this.props.vFilter}
        recentVFilters={this.props.recentVFilters}
        setFilter={this.props.setFilter}
      />
    );
  }
  render() {
    return (this.props.mode === "Versions" ? this.renderModeVersions() : this.renderModeSelected());
  }
}
VersionsBox.propTypes = {
  mode:                     PropTypes.oneOf(["Versions", "Version Open"]),
  versions:                 PropTypes.array.isRequired,
  enVersion:                PropTypes.object,
  heVersion:                PropTypes.object,
  mainVersionLanguage:      PropTypes.oneOf(["english", "hebrew"]).isRequired,
  vFilter:                  PropTypes.array,
  recentVFilters:           PropTypes.array,
  srefs:                    PropTypes.array.isRequired,
  getLicenseMap:            PropTypes.func.isRequired,
  translateISOLanguageCode: PropTypes.func.isRequired,
  setConnectionsMode:       PropTypes.func.isRequired,
  setFilter:                PropTypes.func.isRequired,
};


class VersionsTextList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
    };
  }
  componentDidMount() {
    this.preloadText(this.props.vFilter);
  }
  componentWillReceiveProps(nextProps) {
    this.preloadText(nextProps.vFilter);
  }
  preloadText(filter) {
    if (filter.length) {
      this.setState({loaded: false});
      const sectionRef = this.getSectionRef();
      const language = Sefaria.versionLanguage(filter[0]);
      let enVersion = null, heVersion = null;
      if (language === "en") { enVersion = filter[0]; }
      else                   { heVersion = filter[0]; }
      Sefaria.text(sectionRef, {enVersion, heVersion}, () => {this.setState({loaded: true})});
    }
  }
  getSectionRef() {
    const ref = this.props.srefs[0]; // TODO account for selections spanning sections
    const sectionRef = Sefaria.sectionRef(ref) || ref;
    return sectionRef;
  }
  fakeFunc() {

  }
  render() {
    const versionLanguage = Sefaria.versionLanguage(this.props.vFilter[0]);
    let enVersion = null, heVersion = null;
    if (versionLanguage === "en") { enVersion = this.props.vFilter[0]; }
    else                          { heVersion = this.props.vFilter[0]; }

    return !this.state.loaded || !this.props.vFilter.length ?
      (<LoadingMessage />) :
      (<div className="versionsTextList">
        <RecentFilterSet
          srefs={this.props.srefs}
          asHeader={false}
          filter={this.props.vFilter}
          recentFilters={this.props.recentVFilters}
          setFilter={this.props.setFilter}/>
        <TextRange
          panelPosition ={this.props.panelPosition}
          sref={Sefaria.humanRef(this.props.srefs)}
          enVersion={enVersion}
          heVersion={heVersion}
          useVersionLanguage={true}
          hideTitle={true}
          numberLabel={0}
          basetext={false}
          onRangeClick={this.fakeFunc}
          onCitationClick={this.fakeFunc}
          onNavigationClick={this.fakeFunc}
          onCompareClick={this.fakeFunc}
          onOpenConnectionsClick={this.fakeFunc} />
      </div>);
  }
}
VersionsTextList.propTypes = {
  srefs: PropTypes.array,
  vFilter: PropTypes.array,
  recentVFilters: PropTypes.array,
  setFilter: PropTypes.func.isRequired,
};

module.exports = VersionsBox;