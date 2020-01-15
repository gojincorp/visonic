const validIssueStatus = {
    New: true,
    Open: true,
    Assigned: true,
    Fixed: true,
    Verified: true,
    Closed: true,
}

const issueFieldType = {
    status: 'required',
    owner: 'required',
    effort: 'optional',
    created: 'required',
    completionDate: 'optional',
    title: 'required',
}

function validateIssue(issue) {
    const errors = []
    Object.entries(issueFieldType).forEach(([fieldName, fieldType]) => {
        if (fieldType === 'required' && !issue[fieldName]) {
            errors.push(`Missing required field:  ${fieldName}`)
        }
    })

    if (!validIssueStatus[issue.status]) {
        errors.push(`${issue.status} is not a valid status.`)
    }

    return (errors.length ? errors.join('; ') : null)
}

export default {
    validateIssue,
}
