/* eslint max-len: 0 */
import express from 'express'
import path from 'path'
import https from 'https'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import moment from 'moment'
import SourceMapSupport from 'source-map-support' // Source Maps
import cors from 'cors'                 // Cross origin resource sharing
import bodyParser from 'body-parser'    // Handler for processing req.body
import bodyParserXml from 'body-parser-xml'
// import { MongoClient, ObjectId } from 'mongodb'   // Database
import mongoose from 'mongoose'         // mongodb wrap module to add schema support
import fs from 'fs'                     // File stream
import 'core-js/stable'                 // Replacement for @babel/polyfill
import 'regenerator-runtime/runtime'    // Replacement for @babel/polyfill
import querystring from 'querystring'
import { _delay, setTimeoutLoop } from './utils/general'
import Issue from './issues'         // Custom module

moment().format()

/**
 * Initialize constants
 **************************************************************************** */
const appHttps = express() // External facing secure client web server
const appHttp = express() // Internal facing insecure Visonic proxy web server
const visonicIp = '192.168.2.200'
const visonicUser = 'ibvadmin'
const visonicPwd = 'blgn5w5ojk'
const visonicSerial = 2710015066
const visonicAccount = 696966
const baseUrl = `http://${visonicIp}`
const cmdLogin = `${baseUrl}/web/ajax/login.login.ajax.php`
// const cmdLogout = `${baseUrl}/web/login.php?act=logout`
// const cmdArming = `${baseUrl}/web/ajax/security.main.status.ajax.php`
const cmdStatus = `${baseUrl}/web/ajax/alarm.chkstatus.ajax.php`
// const cmdLogs = `${baseUrl}/web/ajax/setup.log.ajax.php`
// const cmdAutoLogout = `${baseUrl}/web/ajax/system.autologout.ajax.php`
// const cmdSearch = `${baseUrl}/web/ajax/home.search.ajax.php`
// const pgLogin = `${baseUrl}/web/login.php`
// const pgPanel = `${baseUrl}/web/panel.php`
// const pgFrame = `${baseUrl}/web/frameSetup_ViewLog.php`

let cancelPollingLoop
let cancelLoginLoop
let visonicCookie = ''
let visonicSessionId = ''
const sessionData = {
    curindex: 0,
    sesid: visonicSessionId,
    sesusername: visonicUser,
    sesusermanager: 99,
    serial: visonicSerial,
    account: visonicAccount,
}
let db
const pingJitter = 120000 // 2 minutes
const sensorBuffer = 10000 // 5 seconds

/**
 * MongoDB Schemas
 **************************************************************************** */
const { Schema } = mongoose
const systemConfigSchema = new Schema({
    serial: Number,
    id: String,
    account: String,
    ver_hw: String,
    ver_sw: String,
    ver_var: String,
    upgrade_status: Number,
    configuration_status: Number,
    sensorId: {
        type: Map, // <zone>
        of: {
            _id: false,
            zone: Number,
            loc: String,
            type: String,
            chime: String,
            status: String,
            isalarm: Boolean,
        },
    },
})
const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema)
const systemLogSchema = new Schema({
    serial: Number,
    id: String,
    account: String,
    ver_hw: String,
    ver_sw: String,
    ver_var: String,
    upgrade_status: Number,
    configuration_status: Number,
    created: Date, // timestamp without time
    first: Number,
    last: Number,
    samples: [
        {
            _id: false,
            time: Number,
            dataSet: [{
                _id: false,
                src: Number,
                data: String,
            }],
        },
    ],
    sampleCnt: Number,
})
const SystemLog = mongoose.model('SystemLog', systemLogSchema)

/**
 * Misc Bootstrap code
 **************************************************************************** */
bodyParserXml(bodyParser)

// Polyfill test
// console.log(Array.from('foobar'))

// SSL support
const hskey = fs.readFileSync('/Users/ibserveradmin/letsencrypt/config/live/visonic.ideasbeyond.com/privkey.pem')
const hscert = fs.readFileSync('/Users/ibserveradmin/letsencrypt/config/live/visonic.ideasbeyond.com/cert.pem')
const options = {
    key: hskey,
    cert: hscert,
}

// Source map support to help with debugging code
SourceMapSupport.install()

/**
 * Hot Module Replacement (HMR) and Webpack middleware for client side code.
 * Please note that intermediate and distribution files are kept in memory.  So,
 * for 'production' deployment you will need to transpile physical files.
 **************************************************************************** */
if (process.env.NODE_ENV !== 'production') {
    const webpack = require('webpack')
    const webpackDevMiddleware = require('webpack-dev-middleware')
    const webpackHotMiddleware = require('webpack-hot-middleware')

    const config = require('../../../../webpack.config.js')
    config.entry.main.push('webpack-hot-middleware/client?reload=true&timeout=1000')
    config.plugins.push(new webpack.HotModuleReplacementPlugin())

    const bundler = webpack(config)
    appHttps.use(webpackDevMiddleware(bundler, { noInfo: true }))
    appHttps.use(webpackHotMiddleware(bundler, { log: console.log }))
}

/**
 * Initialize middleware for HTTP router
 **************************************************************************** */
appHttp.use(cors())
appHttp.use(bodyParser.json())
appHttp.use(bodyParser.xml())

/**
 * Initialize middleware for HTTPS router
 **************************************************************************** */
appHttps.use(cors())
appHttps.use(express.static('Resources/Private/Powerlink/static'))
appHttps.use('/SensorQuickView', express.static('Resources/Public/js'))
appHttps.use('/SensorQuickView', express.static('Resources/Private/Powerlink/static'))
appHttps.use(express.static('Resources/Public/js'))
appHttps.use(express.static('Resources/Public/src'))
appHttps.use(express.static('node_modules'))
appHttps.use(bodyParser.json())
appHttps.use(bodyParser.xml())

/**
 * RESTful like API (HTTPS)
 **************************************************************************** */

// Static error page test
// -----------------------------------------------------------------------------
appHttps.get('/api/error', (req, res) => {
    res.status(400).json({
        message: 'Testing server error...',
    })
})

// Query for all system statistics
// -----------------------------------------------------------------------------
// let testCnt = 0
appHttps.get('/api/allstats/:param1?/:param2?/:param3?', (req, res) => {
    let {
        newStart,
        newEnd,
    } = req.query
    if (!newStart) {
        newEnd = new Date().setMilliseconds(0)
        newStart = newEnd - 432000000 // 432000000 = 5 days ago 
    }
    newEnd = parseInt(newEnd, 10)
    newStart = parseInt(newStart, 10)
    const newStartBuffer = newStart - sensorBuffer
    // console.log(`Timings:  start=${startTime}, end=${endTime}, newStart=${newStart}, newEnd=${newEnd}`, req.params)

    SystemLog.aggregate([
        {
            $match: {
                last: {
                    $gte: newStartBuffer,
                },
            },
        },
        {
            $project: {
                _id: 0,
                samples: 1,
            },
        },
        {
            $unwind: {
                path: '$samples',
            },
        },
        {
            $match: {
                'samples.time': {
                    $gte: newStartBuffer,
                },
            },
        },
        {
            $unwind: {
                path: '$samples.dataSet',
            },
        },
        {
            $group: {
                _id: '$samples.dataSet.src',
                srcData: {
                    $push: {
                        time: '$samples.time',
                        data: '$samples.dataSet.data',
                    },
                },
            },
        },
    ])
        .then(docs => {
            const allData = docs.reduce((docData, { _id, srcData }) => {
                let prevTime = newStartBuffer
                let prevState = null
                let prevData = null
                docData[_id] = []
                if (_id === 0) {
                // Checking 'online' status based on 'ping' or '[NOCNG]' message
                    docData[_id] = srcData.reduce((tmpData, { time }) => {
                        if (time - prevTime > sensorBuffer) {
                        // Ping not found within jitter...need to log
                            tmpData.push({
                                x: prevTime + sensorBuffer,
                                y: 0,
                                data: '',
                            })
                            tmpData.push({
                                x: time,
                                y: 1,
                                data: '',
                            })
                            prevState = 1
                        } else if (prevState === null) {
                            tmpData.push({
                                x: time,
                                y: 1,
                                data: '',
                            })
                            tmpData.push({
                                x: prevTime + sensorBuffer,
                                y: 1,
                                data: '',
                            })
                            prevState = 1
                        }
                        prevTime = time
                        return tmpData
                    }, [])

                    if (newEnd - prevTime > sensorBuffer) {
                        docData[_id].push({
                            x: newEnd,
                            y: 0,
                            data: '',
                        })
                    } else {
                        docData[_id].push({
                            x: newEnd,
                            y: prevState,
                            data: '',
                        })
                    }
                } else {
                    docData[_id] = srcData.reduce((tmpData, { time, data }) => {
                        if (time > newStart) {
                            if (!tmpData.length) {
                                prevTime = newStart
                                prevData = (prevData === null ? 'Unknown' : prevData)
                                if (prevData === 'OK') {
                                    prevState = 0
                                } else if (prevData === 'Open') {
                                    prevState = 1
                                } else {
                                    prevState = -1
                                }
                                tmpData.push({
                                    x: prevTime,
                                    y: prevState,
                                    data: prevData,
                                })
                            }
                            if (prevData !== data) {
                                let y = -1
                                if (data === 'OK') {
                                    y = 0
                                } else if (data === 'Open') {
                                    y = 1
                                }
                                tmpData.push({
                                    x: time,
                                    y,
                                    data,
                                })
                            }
                        }
                        prevTime = time
                        prevData = data
                        return tmpData
                    }, [])

                    if (newEnd > docData[_id][docData[_id].length - 1].x) {
                        prevState = (prevData === 'OK' ? 0 : (prevData === 'Open' ? 1 : -1))
                        docData[_id].push({
                            x: newEnd,
                            y: prevState,
                            data: prevData,
                        })
                    }
                }
                return docData
            }, [])
            /*
            if (endTime - prevTime > pingJitter) {
                pingLog.push({
                    x: endTime,
                    y: 0,
                })
            } else {
                pingLog.push({
                    x: endTime,
                    y: prevState,
                })
            }
            */
            res.json(allData)
            /* Code for testing server error response...
            if (testCnt++ % 4 === 0) {
                res.json(allData)
            } else {
                res.status(500).json({ message: 'Testing server error response...' })
            }
            */
        })
        .catch(err => {
            console.log(`Error:  ${err}`)
            res.status(500).json({ message: `Internal Server Error: ${err}` })
        })
})


// Query for single sensor statistics
// -----------------------------------------------------------------------------
appHttps.get('/api/sensor-data/:sensor_id', (req, res) => {
    const {
        sensor_id,
    } = req.params
    let {
        newStart,
        newEnd,
    } = req.query
    if (!newStart) {
        newEnd = new Date().setMilliseconds(0)
        newStart = newEnd - 432000000 // 432000000 = 5 days ago 
    }
    newEnd = parseInt(newEnd, 10)
    newStart = parseInt(newStart, 10)
    const newStartBuffer = newStart - sensorBuffer

    SystemLog.aggregate([
        {
            $match: {
                last: {
                    $gte: newStartBuffer,
                },
            },
        },
        {
            $project: {
                _id: 0,
                samples: 1,
            },
        },
        {
            $unwind: {
                path: '$samples',
            },
        },
        {
            $match: {
                'samples.time': {
                    $gte: newStartBuffer,
                },
            },
        },
        {
            $unwind: {
                path: '$samples.dataSet',
            },
        },
        {
            $match: {
                'samples.dataSet.src': parseInt(sensor_id, 10),
            },
        },
        {
            $group: {
                _id: '$samples.dataSet.src',
                srcData: {
                    $push: {
                        time: '$samples.time',
                        data: '$samples.dataSet.data',
                    },
                },
            },
        },
    ])
        .then(docs => {
            const allData = docs.reduce((docData, { _id, srcData }) => {
                let prevTime = newStartBuffer
                let prevState = null
                let prevData = null
                docData[_id] = []
                if (_id === 0) {
                // Checking 'online' status based on 'ping' or '[NOCNG]' message
                    docData[_id] = srcData.reduce((tmpData, { time }) => {
                        if (time - prevTime > sensorBuffer) {
                        // Ping not found within jitter...need to log
                            tmpData.push({
                                x: prevTime + sensorBuffer,
                                y: 0,
                                data: '',
                            })
                            tmpData.push({
                                x: time,
                                y: 1,
                                data: '',
                            })
                            prevState = 1
                        } else if (prevState === null) {
                            tmpData.push({
                                x: time,
                                y: 1,
                                data: '',
                            })
                            tmpData.push({
                                x: prevTime + sensorBuffer,
                                y: 1,
                                data: '',
                            })
                            prevState = 1
                        }
                        prevTime = time
                        return tmpData
                    }, [])

                    if (newEnd - prevTime > sensorBuffer) {
                        docData[_id].push({
                            x: newEnd,
                            y: 0,
                            data: '',
                        })
                    } else {
                        docData[_id].push({
                            x: newEnd,
                            y: prevState,
                            data: '',
                        })
                    }
                } else {
                    docData[_id] = srcData.reduce((tmpData, { time, data }) => {
                        if (time > newStart) {
                            if (!tmpData.length) {
                                prevTime = newStart
                                prevData = (prevData === null ? 'Unknown' : prevData)
                                if (prevData === 'OK') {
                                    prevState = 0
                                } else if (prevData === 'Open') {
                                    prevState = 1
                                } else {
                                    prevState = -1
                                }
                                tmpData.push({
                                    x: prevTime,
                                    y: prevState,
                                    data: prevData,
                                })
                            }
                            if (prevData !== data) {
                                let y = -1
                                if (data === 'OK') {
                                    y = 0
                                } else if (data === 'Open') {
                                    y = 1
                                }
                                tmpData.push({
                                    x: time,
                                    y,
                                    data,
                                })
                            }
                        }
                        prevTime = time
                        prevData = data
                        return tmpData
                    }, [])

                    if (newEnd > prevTime) {
                        prevState = (prevData === 'OK' ? 0 : (prevData === 'Open' ? 1 : -1))
                        docData[_id].push({
                            x: newEnd,
                            y: prevState,
                            data: prevData,
                        })
                    }
                }
                return docData
            }, [])
            /*
            if (endTime - prevTime > pingJitter) {
                pingLog.push({
                    x: endTime,
                    y: 0,
                })
            } else {
                pingLog.push({
                    x: endTime,
                    y: prevState,
                })
            }
            */
            res.json(allData)
            /* Code for testing server error response...
            if (testCnt++ % 4 === 0) {
                res.json(allData)
            } else {
                res.status(500).json({ message: 'Testing server error response...' })
            }
            */
        })
        .catch(err => {
            console.log(`Error:  ${err}`)
            res.status(500).json({ message: `Internal Server Error: ${err}` })
        })
})

// Query for ping log
//-----------------------------------------------------------------------------
appHttps.get('/api/pinglog', (req, res) => {
    const {
        newEnd,
    } = req.query
    let {
        newStart = (new Date().setMilliseconds(0) - 432000000), // 432000000 = 5 days ago
    } = req.query
    newStart = parseInt(newStart, 10)

    console.log(`Timings:  newStart=${newStart}, newEnd=${newEnd}`)

    SystemLog.aggregate([
        {
            $match: {
                last: {
                    $gte: newStart,
                },
            },
        },
        {
            $project: {
                _id: 0,
                samples: 1,
            },
        },
        {
            $unwind: {
                path: '$samples',
            },
        },
        {
            $match: {
                'samples.time': {
                    $gte: newStart,
                },
            },
        },
        {
            $unwind: {
                path: '$samples.dataSet',
            },
        },
        {
            $match: {
                'samples.dataSet.src': 0,
                'samples.dataSet.data': 'ping',
            },
        },
        {
            $group: {
                _id: '$samples.dataSet.src',
                pingData: {
                    $push: '$samples.time',
                },
            },
        },
    ])
        .then(docs => {
            let time
            let prevTime = 0
            let endTime = 0
            let prevState
            const pingLog = docs.reduce((tempLog, doc) => {
                for (let i = 0; i < doc.pingData.length; i++) {
                    time = doc.pingData[i]
                    if (!prevTime) {
                    // First sample
                        if (time - newStart > pingJitter) {
                            tempLog.push({
                                x: newStart,
                                y: 0,
                            })
                            tempLog.push({
                                x: time,
                                y: 1,
                            })
                        } else {
                            tempLog.push({
                                x: newStart,
                                y: 1,
                            })
                            tempLog.push({
                                x: time,
                                y: 1,
                            })
                        }
                        prevState = 1
                        prevTime = time
                        endTime = time
                    } else if (prevState) {
                        if (time - prevTime > pingJitter) {
                        // Ping not found within jitter...need to log
                            tempLog.push({
                                x: prevTime + 60000,
                                y: 0,
                            })
                            tempLog.push({
                                x: time,
                                y: 1,
                            })
                            prevState = 1
                        }
                        prevTime = time
                        endTime = time
                    } else {
                        tempLog.push({
                            x: time,
                            y: 1,
                        })
                        prevState = 1
                        prevTime = time
                        endTime = time
                    }
                }
                return tempLog
            }, [])
            if (endTime - prevTime > pingJitter) {
                pingLog.push({
                    x: endTime,
                    y: 0,
                })
            } else {
                pingLog.push({
                    x: endTime,
                    y: prevState,
                })
            }
            res.json(pingLog)
        })
        .catch(err => {
            console.log(`Error:  ${err}`)
            res.status(500).json({ message: `Internal Server Error: ${err}` })
        })
})

// DEPRECATED:  Query for all sensor statistics
//-----------------------------------------------------------------------------
appHttps.get('/api/sensors', (req, res) => {
    SystemConfig.aggregate([
        {
            $project: {
                _id: 0,
                sensorId: { $objectToArray: '$sensorId' },
            },
        },
        {
            $unwind: {
                path: '$sensorId',
            },
        },
        {
            $project: {
                id: { $toInt: '$sensorId.k' },
                loc: '$sensorId.v.loc',
                type: '$sensorId.v.type',
            },
        },
        {
            $sort: {
                id: 1,
            },
        },
    ])
        .then(docs => {
            res.json(docs)
        })
        .catch(err => {
            console.log(`Error:  ${err}`)
            res.status(500).json({ message: `Internal Server Error: ${err}` })
        })
})

// DEPRECATED:  Query for test issues
//-----------------------------------------------------------------------------
appHttps.get('/api/issues', (req, res) => {
    db.collection('issues').find().toArray()
        .then(issues => {
            const _metadata = { totalCnt: issues.length }
            res.json({ _metadata, records: issues })
        })
        .catch(error => {
            console.log(error)
            res.status(500).json({ message: `Internal Server Error: ${error}` })
        })
})

// Catch all GET handler
//-----------------------------------------------------------------------------
appHttps.get('/*', (req, res) => {
    console.log('IB  (HTTPS-GET: /*):  ', typeof req, typeof res)
    res.sendFile(path.join(__dirname, '../static', 'index.html'))
})

// DEPRECATED:  Query for test issues
//-----------------------------------------------------------------------------
appHttps.post('/api/issues', (req, res) => {
    const newIssue = req.body
    newIssue.created = new Date()
    if (!newIssue.status) newIssue.status = 'New'

    const err = Issue.validateIssue(newIssue)
    if (err) {
        return res.status(422).json({ message: `Invalid request:  ${err}` })
    }

    return db.collection('issues').insertOne(newIssue)
        .then(result => db.collection('issues').find({ _id: result.insertedId }).limit(1).next())
        .then(returnIssue => res.json(returnIssue))
        .catch(error => {
            console.log(error)
            res.status(500).json({ message: `Internal Server Error: ${error}` })
        })
})

/**
 * RESTful like API (HTTP) for handling requests from PowerLink module
 **************************************************************************** */

// General ping from Powerlink module
// -----------------------------------------------------------------------------
appHttp.get('/scripts/update.php*', (req, res) => {
    const logDate = new Date(new Date().setMilliseconds(0))
    sessionData.serial = req.query.serial

    SystemConfig.updateOne({
        serial: sessionData.serial,
    },
    {
        $set: {
            ...req.query,
        },
    },
    {
        upsert: true,
    })
        .then((/* results */) => {
            // console.log('Powerlink -> IB (GET: /scripts/update.php*):  System config...', typeof results)
        })

    SystemLog.updateOne({
        serial: sessionData.serial,
        created: new Date(logDate.toLocaleDateString()),
        sampleCnt: { $lt: 10000 },
        samples: {
            $elemMatch: {
                time: logDate.getTime(),
            },
        },
    },
    {
        $push: {
            'samples.$.dataSet': {
                src: 0,
                data: 'ping',
            },
        },
        $inc: { sampleCnt: 1 },
        $min: { first: logDate },
        $max: { last: logDate },
    },
    {
        upsert: false,
    })
        .then(results => {
            // console.log('Powerlink -> IB (GET: /scripts/update.php* A):  System logs...', typeof results)
            if (!results.n) {
                SystemLog.updateOne({
                    serial: sessionData.serial,
                    created: new Date(logDate.toLocaleDateString()),
                    sampleCnt: { $lt: 10000 },
                },
                {
                    $setOnInsert: {
                        ...req.query,
                    },
                    $push: {
                        samples: {
                            time: logDate.getTime(),
                            dataSet: {
                                src: 0,
                                data: 'ping',
                            },
                        },
                    },
                    $inc: { sampleCnt: 1 },
                    $min: { first: logDate },
                    $max: { last: logDate },
                },
                {
                    upsert: true,
                })
                    .then((/* results */) => {
                        // console.log('Powerlink -> IB (GET: /scripts/update.php* B):  System logs...', typeof results)
                    })
            }
        })

    res.send('status=0&ka_time=50&allow=0&\n')
})

// Catch miscellaneous script messages from Visonic PowerLink module
// -----------------------------------------------------------------------------
appHttp.get('/scripts/*', (req, res) => {
    console.log('Powerlink -> IB  (GET: /scripts/*):  ', typeof req, typeof res)
})

// Notification alert from Powerlink module
// -----------------------------------------------------------------------------
appHttp.post('/scripts/notify.php', (req, res) => {
    console.log('Powerlink -> IB (POST: /scripts/notify.php):  ', req.body.notify.index[0], req.body.notify)
    res.type('application/xml')
    res.send(`<response><index>${req.body.notify.index[0]}</index></response>`)
})

// Catch all POST handler
// -----------------------------------------------------------------------------
appHttp.post('/scripts/*', (req, res) => {
    console.log('Powerlink -> IB (POST: /scripts/*):  ', typeof req, typeof res)
})

/**
 * Supporting functions to facilitate Visonic Powerlink polling
 **************************************************************************** */
/*
 * Wrapper POST class for axios module
 * @param {string} url - Full URL
 * @param {string} data - query string data
 * @param {object} config - More Axios config options
 * @return {object}
 */
async function ajaxPost(url, data = null, config = {}) {
    try {
        // console.log(`IB -> PowerLink (POST ${url}):  `)
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
        console.log(`IB -> PowerLink (POST ERR:${url}):  `, err.message)
        // res.status(500).json({ message: `Internal Server Error:  ${err}` })
        throw err
    }
}

/*
 * Internal polling function
 * 
 * @callback function to use during polling cycle
 * @param {number} [interval=5000] - polling interval
 * @param {number} [retries=Infinity] - number of retries for the callback function
 */
function _poll(cb, interval = 5000, retries = Infinity) {
    // console.log('_poll START')
    let counter = retries
    return Promise.resolve()
        .then(cb)
        .catch(function retry(err) {
            console.log(`_poll ERR (retry):  `, err)
            if (counter-- > 0) {
                return _delay(interval)
                    .then(cb)
                    .catch(retry)
            }
            throw err
        })
}

/*
 * Main polling function
 */
function pollVisonic() {
    //
    // List of regular expressions for parsing response from Powerlink
    // ---------------------------------------------------------------
    const reloginRegex = /\[RELOGIN\]/          // Must login again
    const noChangeRegex = /\[NOCNG\]/           // No change
    const sessionIdRegex = /PowerLink=([^;]*)/  // Session ID

    cancelPollingLoop = setTimeoutLoop(function pollingLoop () { return ajaxPost(cmdStatus, querystring.stringify(sessionData), { header: { 'content-type': 'application/x-www-form-urlencoded' } })
        .then((result) => {
            if (reloginRegex.test(result.data)) {
            // System is not logged on...
                console.log("FOOBAR:............")
                throw new Error('Login Failed')
            } else {
            // Proceed to parse XML to JS object
                return parseStringPromise(result.data)
            }
        })
        .then(jsObj => {
            // Must exit if no Powerlink serial number
            if (!sessionData.serial) {
                console.log('IB -> PowerLink:  Powerlink serial number is missing...')
                throw new Error('IB -> PowerLink:  Powerlink serial number is missing...')
            }

            const sampleDate = new Date(new Date().setMilliseconds(0))
            const sampleTime = sampleDate.getTime()

            if (jsObj.reply.customStatus && noChangeRegex.test(jsObj.reply.customStatus[0])) {
            // No change message received ([NOCNG])
                SystemLog.updateOne({
                    serial: sessionData.serial,
                    created: new Date(sampleDate.toLocaleDateString()),
                    sampleCnt: { $lt: 10000 },
                    samples: {
                        $elemMatch: {
                            time: sampleTime,
                        },
                    },
                },
                {
                    $push: {
                        'samples.$.dataSet': {
                            src: 0,
                            data: '[NOCNG]',
                        },
                    },
                    $inc: { sampleCnt: 1 },
                    $min: { first: sampleDate },
                    $max: { last: sampleDate },
                },
                {
                    upsert: false,
                })
                    .then(results => {
                        // console.log(`SystemLog.updateOne:  `, results)
                        if (!results.n) {
                            SystemLog.updateOne({
                                serial: sessionData.serial,
                                created: new Date(sampleDate.toLocaleDateString()),
                                sampleCnt: { $lt: 10000 },
                            },
                            {
                                $push: {
                                    samples: {
                                        time: sampleTime,
                                        dataSet: {
                                            src: 0,
                                            data: '[NOCNG]',
                                        },
                                    },
                                },
                                $inc: { sampleCnt: 1 },
                                $min: { first: sampleDate },
                                $max: { last: sampleDate },
                            },
                            {
                                upsert: true,
                            })
                                .then((/* results */) => {
                                    // console.log(`SystemLog.updateOne:  `, results)
                                })
                        }
                    })

                return
            }

            SystemLog.updateOne({
                serial: sessionData.serial,
                created: new Date(sampleDate.toLocaleDateString()),
                sampleCnt: { $lt: 10000 },
                samples: {
                    $elemMatch: {
                        time: sampleTime,
                    },
                },
            },
            {
                $push: {
                    'samples.$.dataSet': {
                        src: 0,
                        data: '[CNG]',
                    },
                },
                $inc: { sampleCnt: 1 },
                $min: { first: sampleDate },
                $max: { last: sampleDate },
            },
            {
                upsert: false,
            })
                .then(results => {
                    // console.log(`SystemLog.updateOne:  `, results)
                    if (!results.n) {
                        SystemLog.updateOne({
                            serial: sessionData.serial,
                            created: new Date(sampleDate.toLocaleDateString()),
                            sampleCnt: { $lt: 10000 },
                        },
                        {
                            $push: {
                                samples: {
                                    time: sampleTime,
                                    dataSet: {
                                        src: 0,
                                        data: '[CNG]',
                                    },
                                },
                            },
                            $inc: { sampleCnt: 1 },
                            $min: { first: sampleDate },
                            $max: { last: sampleDate },
                        },
                        {
                            upsert: true,
                        })
                            .then((/* results */) => {
                                // console.log(`SystemLog.updateOne:  `, results)
                            })
                    }
                })

            // Track update index
            sessionData.curindex = jsObj.reply.index

            let configObj = {}
            let sensorArr = []
            let tempCnt = 0
            if (jsObj.reply.configuration) {
                sensorArr = jsObj.reply.configuration[0].sensors.reduce((tempArr, sensor) => {
                    tempArr[tempArr.length] = {
                        src: sensor.index[0],
                        data: sensor.status ? sensor.status[0] : 'OK',
                    }
                    tempCnt++
                    return tempArr
                }, sensorArr)

                configObj = jsObj.reply.detectors[0].detector.reduce((tempObj, { zone, loc, type, isalarm, status }) => {
                    tempObj[`sensorId.${zone[0]}.loc`] = loc[0]
                    tempObj[`sensorId.${zone[0]}.type`] = type[0]
                    tempObj[`sensorId.${zone[0]}.isalarm`] = isalarm[0]
                    tempObj[`sensorId.${zone[0]}.status`] = status[0]
                    // tempCnt += 4
                    return tempObj
                }, configObj)
                // console.log(`pollVisonic (configObj):  `, configObj)
            } else if (jsObj.reply.update) {
                sensorArr = jsObj.reply.update[0].sensors.reduce((tempArr, sensor) => {
                    tempArr[tempArr.length] = {
                        src: sensor.index[0],
                        data: sensor.status ? sensor.status[0] : 'OK',
                    }
                    tempCnt++
                    return tempArr
                }, sensorArr)

                configObj = jsObj.reply.detectors[0].detector.reduce((tempObj, { zone, loc, type, isalarm, status }) => {
                    tempObj[`sensorId.${zone[0]}.loc`] = loc[0]
                    tempObj[`sensorId.${zone[0]}.type`] = type[0]
                    tempObj[`sensorId.${zone[0]}.isalarm`] = isalarm[0]
                    tempObj[`sensorId.${zone[0]}.status`] = status[0]
                    // tempCnt += 4
                    return tempObj
                }, configObj)
            }

            SystemConfig.updateOne({
                serial: sessionData.serial,
            },
            {
                $set: configObj,
            },
            {
                upsert: true,
            })
                .then(results => {
                    console.log(`IB -> PowerLink (SystemConfig):  Successful...`, typeof results)
                })

            SystemLog.updateOne(
                {
                    serial: sessionData.serial,
                    created: new Date(sampleDate.toLocaleDateString()),
                    sampleCnt: { $lt: 10000 },
                    samples: {
                        $elemMatch: {
                            time: sampleTime,
                        },
                    },
                },
                {
                    $push: {
                        'samples.$.dataSet': {
                            $each: [...sensorArr],
                        },
                    },
                    $inc: { sampleCnt: tempCnt },
                    $min: { first: sampleDate },
                    $max: { last: sampleDate },
                },
                {
                    upsert: false,
                },
            )
                .then(results => {
                    console.log(`IB -> PowerLink (SystemLog A):  Successful...`, results)
                    if (!results.n) {
                        SystemLog.updateOne({
                            serial: sessionData.serial,
                            created: new Date(sampleDate.toLocaleDateString()),
                            sampleCnt: { $lt: 10000 },
                        },
                        {
                            $setOnInsert: {
                                serial: sessionData.serial,
                                account: sessionData.account,
                            },
                            $push: {
                                samples: {
                                    time: sampleTime,
                                    dataSet: [...sensorArr],
                                },
                            },
                            $inc: { sampleCnt: tempCnt },
                            $min: { first: sampleDate },
                            $max: { last: sampleDate },
                        },
                        {
                            upsert: true,
                        })
                            .then((/* results */) => {
                                // console.log(`IB -> PowerLink (SystemLog B):  Successful...`, typeof results)
                            })
                    }
                })
        })
        .catch(err => {
            //console.log(`pollVisonic (catch::err):  ${err.message}`)
            switch (err.message) {
            case 'Login Failed':
                cancelLoginLoop = setTimeoutLoop(function loginLoop () { return ajaxPost(
                    cmdLogin,
                    `user=${visonicUser}&pass=${visonicPwd}`,
                    {
                        header: {
                            'content-type': 'application/x-www-form-urlencoded',
                        },
                    },
                )
                    .then(({ headers }) => {
                        console.log('Authenticated by Visonic...', headers['set-cookie'][0])
                        visonicCookie = headers['set-cookie'][0]
                        visonicSessionId = visonicCookie.match(sessionIdRegex)[1]
                        sessionData.sesid = visonicSessionId
                        
                        setTimeout(cancelLoginLoop, 0)
                    })},
                5000)
                break
            default:
                break
            }
        })},
    1000)
    
    //cancelVisonicPolling()
}

/**
 * Connect to mongodb and then start server
 **************************************************************************** */
mongoose.connect('mongodb://localhost/visonic', { useUnifiedTopology: true, useNewUrlParser: true })
    .then(dbClient => {
        db = dbClient

        // Initialize web server
        const server = https.createServer(options, appHttps)
        // const io = require('socket.io').listen(server)
        server.listen(8430, () => console.log('Server started on port 8430...'))
        appHttp.listen(8080, () => {
            console.log('App started on port 8080...')
        })

        pollVisonic()
    }).catch(err => {
        console.log('ERROR', err)
    })
