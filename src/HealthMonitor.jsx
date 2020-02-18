import React from 'react'
import Chart from 'chart.js'
import moment from 'moment'
import 'whatwg-fetch'
import { ajaxGet, delay, poll } from './utils/general'
import PingLog from './PingLog'
import SensorStatus from './SensorStatus'

moment().format()

/**
 * Initialize constants
 **************************************************************************** */
const baseUrl = 'https://visonic.ideasbeyond.com:8430'
const cmdGetSensorsConfig = `${baseUrl}/api/sensors`
const cmdGetPingLog = `${baseUrl}/api/pinglog`
const cmdGetSensorStats = `${baseUrl}/api/allstats`

export default class HealthMonitor extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            sensorData: [],
            sensorConfig: [],
            startTime: 0, // currentTime - 604800000,
            endTime: 0, // currentTime
        }

        this.pingChartId = 'pingChart'
        this.sensorChartId = 'sensorChart'
        this.pingChart = null
        this.sensorChart = null

        this.pingStats = this.pingStats.bind(this)
        this.sensorStats = this.sensorStats.bind(this)
    }

    componentDidMount() {
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

        // Start polling for ping status
        // PingLog.pollPingLog()
        ajaxGet(`${cmdGetSensorsConfig}`)
            .then((data) => {
                const sensorConfig = data.reduce((tempArr, { id, loc, type }) => {
                    tempArr[id] = { loc, type }
                    return tempArr
                }, [])

                console.log('FOOBAR:  ', sensorConfig)

                this.setState({
                    sensorConfig,
                })

                // this.pingStats()
                this.sensorStats()
            })
    }

    /**
     * Supporting functions to facilitate polling
     ************************************************************************ */
    pingStats() {
        const jitter = 2 // Allow 2 minute ping buffer before alert
        const newEnd = new Date().setMilliseconds(0)
        let newStart = newEnd - 432000000 // 604800000 = 7 days ago, 432000000 = 5 days ago, 86400000 = 24 hours ago 
        const { startTime, endTime } = this.state
        let prevMoment = false
        let currentMoment
        poll(() => ajaxGet(`${cmdGetPingLog}?startTime=${startTime}&endTime=${endTime}&newStart=${newStart}&newEnd=${newEnd}`)
            .then((data) => {
                console.log('pingStats:  ', this.state, data)
                /*
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
                //console.log('pingStats:  Successful...', pingLogData)

                //this.pingChart.data.datasets[0].data = pingLogData
                //this.pingChart.update()
                */
                
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
     * Supporting functions to facilitate polling
     ************************************************************************ */
    sensorStats() {
        const jitter = 2 // Allow 2 minute sensor buffer before alert
        const newEnd = new Date().setMilliseconds(0)
        let newStart = newEnd - 86400000 // 604800000 = 7 days ago, 432000000 = 5 days ago, 86400000 = 24 hours ago 
        const { startTime, endTime } = this.state
        let prevMoment = false
        let currentMoment
        poll(() => ajaxGet(`${cmdGetSensorStats}?startTime=${startTime}&endTime=${endTime}&newStart=${newStart}&newEnd=${newEnd}`)
            .then((data) => {
                console.log('_poll AllStats:  ', this.state, data[0])

                //this.sensorChart.data.datasets[0].data = data[0]
                //this.sensorChart.update()
                
                this.setState({
                    ...this.state,
                    sensorData: data
                })
                return delay(5000)
            })
            .then(this.sensorStats)
            .catch(err => {
                console.log(`sensorStats (catch):  ${err.message}`)
            }),
        5000)
    }
    
    render() {
        const { sensorData, sensorConfig } = this.state
        console.log("HealthMonitor::render() => ", sensorConfig, sensorData)
        
        if (this.pingChart) {
            this.pingChart.data.datasets[0].data = sensorData[0]
            this.pingChart.update()
        }
        if (this.sensorChart) {
            let updateData = sensorData.reduce((tempData, sensorObj, sensorId) => {
                if (sensorObj && sensorId > 0) {
                    tempData[tempData.length] = {
                        label: `${sensorConfig[parseInt(sensorId)].loc}:  ${sensorConfig[parseInt(sensorId)].type}`,
                        data: sensorObj,
                        steppedLine: true,
                        pointRadius: 3,
                    }
                }
                return tempData
            }, [])
            
            for (let i = 0; i < updateData.length; i++) {
                if (this.sensorChart.data.datasets[i]) {
                    this.sensorChart.data.datasets[i].data = updateData[i].data
                } else {
                    this.sensorChart.data.datasets[i] = updateData[i]
                }
            }
            this.sensorChart.update()
        }
        return (
            <div>
                <PingLog sensorData={sensorData} chartId={this.pingChartId} />
                <hr />
                <SensorStatus sensorData={sensorData} chartId={this.sensorChartId} />
            </div>
        )
    }
}
