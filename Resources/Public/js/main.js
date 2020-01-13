"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

//import "core-js/stable"
//import "regenerator-runtime/runtime"

/*
$(function() {
    const contentNode = document.getElementById('contents')

    const continents = ['Africa','America','Asia','Australia','Europe']
    const message = continents.map(c => `Hello ${c}!`).join(' ')

    const component = <p>{message}</p>
    ReactDOM.render(component, contentNode)
})
*/
$(function () {
  var contentNode = $('#contents')[0];
  /*
  const issues = [
      {
          id: 1,
          status: 'Open',
          owner: 'Foo',
          created: new Date('2019-12-19'),
          effort: 5,
          completionDate: undefined,
          title: 'Issue #1',
      },
      {
          id: 2,
          status: 'Open',
          owner: 'Bar',
          created: new Date('2019-12-19'),
          effort: 5,
          completionDate: undefined,
          title: 'Issue #2',
      },
  ]
  */

  var IssueFilter =
  /*#__PURE__*/
  function (_React$Component) {
    _inherits(IssueFilter, _React$Component);

    function IssueFilter() {
      _classCallCheck(this, IssueFilter);

      return _possibleConstructorReturn(this, _getPrototypeOf(IssueFilter).apply(this, arguments));
    }

    _createClass(IssueFilter, [{
      key: "render",
      value: function render() {
        return React.createElement("div", null, "This is a placeholder for the Issue Filter...");
      }
    }]);

    return IssueFilter;
  }(React.Component);
  /*
  class IssueRow extends React.Component {
      render() {
          const issue = this.props.issue
          
          return (
             <tr>
                 <td>{issue.id}</td>
                 <td>{issue.status}</td>
                 <td>{issue.owner}</td>
                 <td>{issue.created.toDateString()}</td>
                 <td>{issue.effort}</td>
                 <td>{(issue.completionDate !== undefined) ? issue.completionDate.toDateString() : ''}</td>
                 <td>{issue.title}</td>
             </tr>
          )
      }
  }
  IssueRow.propTypes = {
      issue: PropTypes.object
  }
  IssueRow.defaultProps = {}
  */


  var IssueRow = function IssueRow(props) {
    return React.createElement("tr", null, React.createElement("td", null, props.issue._id), React.createElement("td", null, props.issue.status), React.createElement("td", null, props.issue.owner), React.createElement("td", null, props.issue.created.toDateString()), React.createElement("td", null, props.issue.effort), React.createElement("td", null, props.issue.completionDate ? props.issue.completionDate.toDateString() : ''), React.createElement("td", null, props.issue.title));
  };
  /*
  class IssueTable extends React.Component {
      render() {
          const borderedStyle = {
              border: "1px solid silver",
              padding: 6,
          }
          const issueRows = this.props.issues.map(issue => <IssueRow key={issue.id} issue={issue} />)
  
          return (
              <table className="bordered-table">
                  <thead>
                      <tr>
                          <th>Id</th>
                          <th>Status</th>
                          <th>Owner</th>
                          <th>Created</th>
                          <th>Effort</th>
                          <th>Completion Date</th>
                          <th>Title</th>
                      </tr>
                  </thead>
                  <tbody>{issueRows}</tbody>
              </table>
          )
      }
  }
  */


  function IssueTable(props) {
    var issueRows = props.issues.map(function (issue) {
      return React.createElement(IssueRow, {
        key: issue._id,
        issue: issue
      });
    });
    return React.createElement("table", {
      className: "bordered-table"
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Id Test"), React.createElement("th", null, "Status"), React.createElement("th", null, "Owner"), React.createElement("th", null, "Created"), React.createElement("th", null, "Effort"), React.createElement("th", null, "Competion Date"), React.createElement("th", null, "Title"))), React.createElement("tbody", null, issueRows));
  }

  var IssueAdd =
  /*#__PURE__*/
  function (_React$Component2) {
    _inherits(IssueAdd, _React$Component2);

    function IssueAdd() {
      var _this;

      _classCallCheck(this, IssueAdd);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(IssueAdd).call(this));
      _this.handleSubmit = _this.handleSubmit.bind(_assertThisInitialized(_this));
      return _this;
    }

    _createClass(IssueAdd, [{
      key: "handleSubmit",
      value: function handleSubmit(e) {
        e.preventDefault();
        var form = document.forms.issueAdd;
        this.props.createIssue({
          owner: form.owner.value,
          title: form.title.value,
          status: 'New',
          created: new Date()
        });
        form.owner.value = '';
        form.title.value = '';
      }
    }, {
      key: "render",
      value: function render() {
        return React.createElement("div", null, React.createElement("form", {
          name: "issueAdd",
          onSubmit: this.handleSubmit
        }, React.createElement("input", {
          type: "text",
          name: "owner",
          placeholder: "Owner"
        }), React.createElement("input", {
          type: "text",
          name: "title",
          placeholder: "Title"
        }), React.createElement("button", null, "Add")));
      }
    }]);

    return IssueAdd;
  }(React.Component);

  var IssueList =
  /*#__PURE__*/
  function (_React$Component3) {
    _inherits(IssueList, _React$Component3);

    function IssueList() {
      var _this2;

      _classCallCheck(this, IssueList);

      _this2 = _possibleConstructorReturn(this, _getPrototypeOf(IssueList).call(this));
      _this2.state = {
        issues: []
      };
      _this2.createIssue = _this2.createIssue.bind(_assertThisInitialized(_this2));
      return _this2;
    }

    _createClass(IssueList, [{
      key: "componentDidMount",
      value: function componentDidMount() {
        this.loadData();
      }
      /*
      loadData() {
          setTimeout(() => {
              this.setState({
                  issues
              })
          }, 500)
      }
      */

    }, {
      key: "loadData",
      value: function loadData() {
        var _this3 = this;

        fetch('https://visonic.ideasbeyond.com:8080/api/issues').then(function (response) {
          if (response.ok) {
            response.json().then(function (data) {
              console.log("Total count of records:  ".concat(data._metadata.total_count));
              data.records.forEach(function (issue) {
                issue.created = new Date(issue.created);
                if (issue.completionDate) issue.completionDate = new Date(issue.completionDate);
              });

              _this3.setState({
                issues: data.records
              });
            });
          } else {
            response.json().then(function (error) {
              alert("Failed to fetch issues:  ".concat(error.message));
            });
          }
        })["catch"](function (err) {
          alert("Error while fetching data from server:  ".concat(err));
        });
      }
      /*
      createIssue(newIssue) {
          const newIssues = this.state.issues.slice()
          newIssue.id = this.state.issues.length + 1
          newIssues.push(newIssue)
          this.setState({issues: newIssues})
      }
      */

    }, {
      key: "createIssue",
      value: function createIssue(newIssue) {
        var _this4 = this;

        fetch('https://visonic.ideasbeyond.com:8080/api/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newIssue)
        }).then(function (response) {
          if (response.ok) {
            response.json().then(function (updatedIssue) {
              updatedIssue.created = new Date(updatedIssue.created);
              if (updatedIssue.completionDate) updatedIssue.completionDate = new Date(updatedIssue.completionDate);

              var newIssues = _this4.state.issues.concat(updatedIssue);

              _this4.setState({
                issues: newIssues
              });
            });
          } else {
            response.json().then(function (err) {
              alert("Failed to add issue:  ".concat(err.message));
            });
          }
        })["catch"](function (err) {
          alert("Error while sending data to server:  ".concat(err.message));
        });
      }
    }, {
      key: "render",
      value: function render() {
        return React.createElement("div", null, React.createElement("h1", null, "Issue Tracker"), React.createElement(IssueFilter, null), React.createElement("hr", null), React.createElement(IssueTable, {
          issues: this.state.issues
        }), React.createElement("button", {
          onClick: this.createTestIssue
        }, "Add"), React.createElement("hr", null), React.createElement(IssueAdd, {
          createIssue: this.createIssue
        }));
      }
    }]);

    return IssueList;
  }(React.Component);

  ReactDOM.render(React.createElement(IssueList, null), contentNode);
});