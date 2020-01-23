import React from 'react'
import 'whatwg-fetch'
import PropTypes from 'prop-types'
import IssueAdd from './IssueAdd'
import IssueFilter from './IssueFilter'
import PingLog from './PingLog'

export default class HealthMonitor extends React.Component {
    constructor() {
        super()
        this.state = {
        }
    }

    componentDidMount() {
    }

    render() {
        return (
            <div>
                <PingLog />
            </div>
        )
    }
}
