import React from 'react'
import axios from 'axios'
import Chart from 'chart.js'
import moment from 'moment'

moment().format()

/**
 * Initialize constants
 **************************************************************************** */
const baseUrl = 'https://visonic.ideasbeyond.com:8430'
const cmdPingLog = `${baseUrl}/api/allstats`
let myChart

export default class PingLog extends React.Component {
    constructor() {
        super()
    }

    /**
     * Component life cycles
     ************************************************************************ */
    componentDidMount() {
        // Initialize chart
        const pingLog = document.getElementById('sensorStatusChart').getContext('2d')
        myChart = new Chart(pingLog, {
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

        // Start polling for ping status
        //PingLog.pollPingLog()
    }

    /**
     * Supporting functions to facilitate polling
     ************************************************************************ */
    static async ajaxGet(url, query = {}) {
        try {
            const res = await axios.get(url, { params: query })
            const { data } = res
            //console.log(`ajaxGet (${url}):  `, data)
            return data
        } catch (err) {
            return console.log(`ajaxGet (ERR${url}):  `, err)
        }
    }

    /*
    static async ajaxPost(url, data = null, config = {}) {
        try {
            console.log(`ajaxPost (${url}):  `)
            const res = await axios.post(
                url,
                data,
                {
                    ...config,
                    withCredentials: true,
                    ...((visonicCookie ? { headers: { Cookie: visonicCookie } } : null)),
                },
            )
            // const data = res.data
            return res
        } catch (err) {
            console.log(`ajaxPost (ERR/${url}):  `, err.message)
            // res.status(500).json({ message: `Internal Server Error:  ${err}` })
            throw err
        }
    }
        */

    static _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    static _poll(fn, interval = 5000, retries = Infinity) {
        //console.log('_poll START')
        return Promise.resolve()
            .then(fn)
            .catch(function retry(err) {
                console.log(`_poll ERR (retry): ${err}`)
                if (retries-- > 0) {
                    return PingLog._delay(interval)
                        .then(fn)
                        .catch(retry)
                }
                throw err
            })
    }

    static pollPingLog() {
        const jitter = 2 // Allow 2 minute ping buffer before alert
        let prevMoment = false
        let currentMoment
        PingLog._poll(() => PingLog.ajaxGet(cmdPingLog)
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

                myChart.data.datasets[0].data = pingLogData
                myChart.update()

                return PingLog._delay(5000)
            })
            .then(PingLog.pollPingLog)
            .catch(err => {
                console.log(`pollPinglog (catch):  ${err.message}`)
            }),
        5000)
    }

    render() {
        return (
            <canvas id="sensorStatusChart" width={800} height={400} style={{ width: '800px', height: '400px' }} />
        )
    }
}
