import React from 'react'
import axios from 'axios'
import moment from 'moment'
import 'whatwg-fetch'
import PropTypes from 'prop-types'
import IssueAdd from './IssueAdd'
import IssueFilter from './IssueFilter'
import PingLog from './PingLog'
import SensorStatus from './SensorStatus'
import { ajaxGet, delay, poll } from './utils/general'

moment().format()

/**
 * Initialize constants
 **************************************************************************** */
const baseUrl = 'https://visonic.ideasbeyond.com:8430'
const cmdGetPingLog = `${baseUrl}/api/pinglog`
const cmdGetAllStats = `${baseUrl}/api/allstats`

export default class HealthMonitor extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            sampleTime: new Map()
        }
    }

    componentDidMount() {
        // Start polling for ping status
        HealthMonitor.pollAllStats()
    }

    /**
     * Supporting functions to facilitate polling
     ************************************************************************ */
    static pollAllStats() {
        const jitter = 2 // Allow 2 minute ping buffer before alert
        let prevMoment = false
        let currentMoment
        poll(() => PingLog.ajaxGet(cmdGetPingLog)
            .then((data) => {
                //console.log('_poll AllStats:  ', data)
                const pingLogData = []
                Object.keys(data.sampleTime).forEach(time => {
                    if (((data.sampleTime[time].srcId || {})[0] || {}).pinged) {
                        if (!prevMoment) {
                            prevMoment = moment(time, 'x')
                            pingLogData.push({
                                x: prevMoment,
                                y: 1,
                            })
                        } else {
                            currentMoment = moment(time, 'x')
                            if (currentMoment.diff(prevMoment, 'minutes') <= jitter) {
                                prevMoment = currentMoment
                            } else {
                                pingLogData.push({
                                    x: prevMoment,
                                    y: 1,
                                })
                                pingLogData.push({
                                    x: prevMoment.clone().add(1, 'm'),
                                    y: 0,
                                })
                                pingLogData.push({
                                    x: currentMoment.clone().subtract(1, 'm'),
                                    y: 0,
                                })
                                pingLogData.push({
                                    x: currentMoment,
                                    y: 1,
                                })
                                prevMoment = currentMoment
                            }
                        }
                    }
                })
                pingLogData.push({
                    x: currentMoment,
                    y: 1,
                })
                //console.log('pollAllStats:  Successful...', pingLogData)

                //myChart.data.datasets[0].data = pingLogData
                //myChart.update()

                return delay(5000)
            })
            .then(HealthMonitor.pollAllStats)
            .catch(err => {
                console.log(`pollAllStats (catch):  ${err.message}`)
            }),
        5000)
    }
    
    render() {
        const { sampleTimes } = this.state
        return (
            <div>
                <PingLog sampleTimes={sampleTimes} />
                <hr />
                <SensorStatus sampleTimes={sampleTimes} />
            </div>
        )
    }
}
