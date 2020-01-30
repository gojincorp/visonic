import React from 'react'
import 'whatwg-fetch'
import PropTypes from 'prop-types'
import IssueAdd from './IssueAdd'
import IssueFilter from './IssueFilter'
import PingLog from './PingLog'
import SensorStatus from './SensorStatus'

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
                <hr />
                <SensorStatus />
            </div>
        )
    }
}
