import React from 'react'
import 'whatwg-fetch'
import PropTypes from 'prop-types'
import IssueAdd from './IssueAdd'
import IssueFilter from './IssueFilter'

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
               <td>{(issue.completionDate !== undefined)
                   ? issue.completionDate.toDateString()
                   : ''}</td>
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
const IssueRow = ({
    issue: {
        _id,
        status,
        owner,
        created,
        effort,
        completionDate,
        title,
    },
}) => {
    return (
        <tr>
            <td>{_id}</td>
            <td>{status}</td>
            <td>{owner}</td>
            <td>{created.toDateString()}</td>
            <td>{effort}</td>
            <td>{completionDate ? completionDate.toDateString() : ''}</td>
            <td>{title}</td>
        </tr>
    )
}

IssueRow.propTypes = {
    issue: PropTypes.object,
}
IssueRow.defaultProps = {
    issue: {},
}

/*
class IssueTable extends React.Component {
    render() {
        const borderedStyle = {
            border: "1px solid silver",
            padding: 6,
        }
        const issueRows = this.props.issues.map(issue =>
            <IssueRow key={issue.id} issue={issue} />
        )

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
function IssueTable({ issues }) {
    const issueRows = issues.map(issue =>
        <IssueRow key={issue._id} issue={issue} />
    )
    return (
        <table className="bordered-table">
            <thead>
                <tr>
                    <th>Id Test</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Created</th>
                    <th>Effort</th>
                    <th>Competion Date</th>
                    <th>Title</th>
                </tr>
            </thead>
            <tbody>
                {issueRows}
            </tbody>
        </table>
    )
}

IssueTable.propTypes = {
    issues: PropTypes.object,
}

IssueTable.defaultProps = {
    issues: [],
}

export default class IssueList extends React.Component {
    constructor() {
        super()
        this.state = {
            issues: [],
        }

        this.createIssue = this.createIssue.bind(this)
    }

    componentDidMount() {
        this.loadData()
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
    loadData() {
        fetch('https://visonic.ideasbeyond.com:8430/api/issues').then(response => {
            if (response.ok) {
                response.json().then(data => {
                    // console.log(`Total count of records:  ${data._metadata.total_count}`)
                    data.records.forEach(issue => {
                        issue.created = new Date(issue.created)
                        if (issue.completionDate) {
                            issue.completionDate = new Date(issue.completionDate)
                        }
                    })
                    this.setState({ issues: data.records })
                })
            } else {
                response.json().then(error => {
                    alert(`Failed to fetch issues:  ${error.message}`)
                })
            }
        }).catch(err => {
            alert(`Error while fetching data from server:  ${err}`)
        })
    }

    /*
    createIssue(newIssue) {
        const newIssues = this.state.issues.slice()
        newIssue.id = this.state.issues.length + 1
        newIssues.push(newIssue)
        this.setState({issues: newIssues})
    }
    */
    createIssue(newIssue) {
        const { issues } = this.state
        fetch('https://visonic.ideasbeyond.com:8430/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newIssue),
        }).then(response => {
            if (response.ok) {
                response.json().then(updatedIssue => {
                    updatedIssue.created = new Date(updatedIssue.created)
                    if (updatedIssue.completionDate) {
                        updatedIssue.completionDate = new Date(updatedIssue.completionDate)
                    }
                    const newIssues = issues.concat(updatedIssue)
                    this.setState({ issues: newIssues })
                })
            } else {
                response.json().then(err => {
                    alert(`Failed to add issue:  ${err.message}`)
                })
            }
        }).catch(err => {
            alert(`Error while sending data to server:  ${err.message}`)
        })
    }

    render() {
        const { issues } = this.state
        return (
            <div>
                <h1>Issue Tracker</h1>
                <IssueFilter />
                <hr />
                <IssueTable issues={issues} />
                <hr />
                <IssueAdd createIssue={this.createIssue} />
            </div>
        )
    }
}
