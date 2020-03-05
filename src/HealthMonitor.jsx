// Builtin/3rd Party Modules
// -----------------------------------------------------------------------------
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Chart from 'chart.js'
import moment from 'moment'
import 'whatwg-fetch'

// Custom Modules
// -----------------------------------------------------------------------------
import {
    ajaxGet,
    delay,
    poll,
    setTimeoutLoop,
} from './utils/general'
import PingLog from './PingLog'
import SensorStatus from './SensorStatus'
import { dispatcher } from './utils/dispatchers'

moment().format()

/**
 * Initialize constants
 **************************************************************************** */
const baseUrl = 'https://visonic.ideasbeyond.com:8430'
const cmdGetSensorsConfig = `${baseUrl}/api/sensors`
const cmdGetPingLog = `${baseUrl}/api/pinglog`
const cmdGetSensorStats = `${baseUrl}/api/allstats`

// const badUrl = 'https://visonic.ideasbeyond.com:8431'
// const cmdBad = `${badUrl}/api/allstats`

class HealthMonitor extends React.Component {
    /*
     * HealthMonitor constructor
     * @param {object} props - Properties received from parent
     * @return {void}
     */
    constructor(props) {
        super(props)

        // Initialize chartjs configuration
        // ---------------------------------------------------------------------
        this.pingChartId = 'pingChart'
        this.sensorChartId = 'sensorChart'
        this.pingChart = null
        this.sensorChart = null
        this.clearSensorLoop = null

        // Explicite binding for 'this'
        // ---------------------------------------------------------------------
        this.pingStats = this.pingStats.bind(this)
        this.sensorStats = this.sensorStats.bind(this)
    }

    /*
     * React component lifecycle triggered after the component has mounted into
     * DOM tree but before anything is rendered
     * @return {void}
     */
    componentDidMount() {
        // Ping chart setup
        // ---------------------------------------------------------------------
        const pingLog = document.getElementById(this.pingChartId).getContext('2d')
        this.pingChart = new Chart(pingLog, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Visonic Ping Status',
                    data: [],
                    steppedLine: true,
                    pointRadius: 3,
                }],
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'time',
                        ticks: {
                            major: {
                                enabled: true,
                                fontSize: 14,
                                fontStyle: 'bold',
                            },
                        },
                    }],
                    yAxes: [{
                        ticks: {
                            callback(value) {
                                switch (value) {
                                case 1:
                                    return 'Ping'
                                case 0:
                                    return 'No Ping'
                                default:
                                    return ''
                                }
                            },
                        },
                    }],
                },
                responsive: false,
            },
        })

        // Sensor chart setup
        // ---------------------------------------------------------------------
        const sensorLog = document.getElementById(this.sensorChartId).getContext('2d')
        this.sensorChart = new Chart(sensorLog, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Visonic Sensor Status',
                    data: [],
                    steppedLine: true,
                    pointRadius: 3,
                }],
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'time',
                        ticks: {
                            major: {
                                enabled: true,
                                fontSize: 14,
                                fontStyle: 'bold',
                            },
                        },
                    }],
                    yAxes: [{
                        ticks: {
                            callback(value) {
                                switch (value) {
                                case 1:
                                    return 'Open'
                                case 0:
                                    return 'OK'
                                case -1:
                                    return 'Alert'
                                default:
                                    return ''
                                }
                            },
                        },
                    }],
                },
                responsive: false,
            },
        })

        // Initialize general system configuration state.  Also, start polling
        // for sensor stats
        // ---------------------------------------------------------------------
        ajaxGet(`${cmdGetSensorsConfig}`)
            .then((data) => {
                const {
                    loadSensorConfig,
                } = this.props

                const sensorConfig = data.reduce((tempArr, { id, loc, type }) => {
                    tempArr[id] = { loc, type }
                    return tempArr
                }, [])
                sensorConfig[0] = {} // Placeholder for ping status
                loadSensorConfig({ data: sensorConfig })

                this.sensorStats()
            })
    }

    /*
     * React component lifecycle triggered when the component is about to unmount
     * from the DOM and be destroyed.
     * @return {void}
     */
    componentWillUnmount() {
        this.clearSensorLoop()
    }

    /**
     * Start polling for ping status
     ************************************************************************ */
    pingStats() {
        const newEnd = new Date().setMilliseconds(0)
        // 604800000 = 7 days ago, 432000000 = 5 days ago, 86400000 = 24 hours ago 
        const newStart = newEnd - 432000000
        poll(() => ajaxGet(`${cmdGetPingLog}?newStart=${newStart}&newEnd=${newEnd}`)
            .then((data) => {
                console.log('pingStats:  ', this.state, data)

                this.pingChart.data.datasets[0].data = data
                this.pingChart.update()
                return delay(5000)
            })
            .then(this.pingStats)
            .catch(err => {
                console.log(`pingStats (catch):  ${err.message}`)
            }),
        5000)
    }

    /**
     * Start polling for sensor status
     ************************************************************************ */
    sensorStats() {
        this.clearSensorLoop = setTimeoutLoop(() => {
            const newEnd = new Date().setMilliseconds(0)
            // 604800000 = 7 days ago, 432000000 = 5 days ago, 86400000 = 24 hours ago 
            const newStart = newEnd - 86400000
            return ajaxGet(`${cmdGetSensorStats}?newStart=${newStart}&newEnd=${newEnd}`)
                .then((data) => {
                    const {
                        loadSensorData,
                    } = this.props

                    loadSensorData({ data })
                })
                .catch(err => {
                    console.log(`CATCH ERR (sensorStats):  ${err.message}`)
                    throw new Error(err.message)
                })
        },
        5000, 5)
    }

    render() {
        const {
            props: {
                sensors,
            },
            pingChart,
            sensorChart,
        } = this
        // console.log('HealthMonitor::render() => ', sensors)

        if (pingChart) {
            pingChart.data.datasets[0].data = sensors[0].data
            pingChart.update()
        }
        if (sensorChart) {
            const updateData = sensors.reduce((tempData, sensorObj, sensorId) => {
                if (sensorObj && sensorId > 0) {
                    tempData[tempData.length] = {
                        label: `${sensors[parseInt(sensorId, 10)].loc}:  ${sensors[parseInt(sensorId, 10)].type}`,
                        data: sensorObj.data,
                        steppedLine: true,
                        pointRadius: 3,
                    }
                }
                return tempData
            }, [])

            for (let i = 0; i < updateData.length; i++) {
                if (sensorChart.data.datasets[i]) {
                    sensorChart.data.datasets[i].data = updateData[i].data
                } else {
                    sensorChart.data.datasets[i] = updateData[i]
                }
            }
            sensorChart.update()
        }
        return (
            <div>
                <PingLog chartId={this.pingChartId} />
                <hr />
                <SensorStatus chartId={this.sensorChartId} />
            </div>
        )
    }
}

HealthMonitor.propTypes = {
    sensors: PropTypes.array.isRequired,
    loadSensorConfig: PropTypes.func.isRequired,
    loadSensorData: PropTypes.func.isRequired,
}

const mapStateToProps = state => ({
    sensors: state.sensors,
})

const mapDispatchToProps = dispatch => (dispatcher(dispatch))

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(HealthMonitor)
