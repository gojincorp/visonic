import React from 'react'
import PropTypes from 'prop-types'

export default class IssueAdd extends React.Component {
    constructor() {
        super()
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleSubmit(e) {
        e.preventDefault()

        const { createIssue } = this.props
        const form = document.forms.issueAdd
        createIssue({
            owner: form.owner.value,
            title: form.title.value,
            status: 'New',
            created: new Date(),
        })
        form.owner.value = ''
        form.title.value = ''
    }

    render() {
        return (
            <div>
                <form name="issueAdd" onSubmit={this.handleSubmit}>
                    <input type="text" name="owner" placeholder="Owner" />
                    <input type="text" name="title" placeholder="Title" />
                    <button type="submit">Add</button>
                </form>
            </div>
        )
    }
}

IssueAdd.propTypes = {
    createIssue: PropTypes.func,
}

IssueAdd.defaultProps = {
    createIssue: () => {},
}
