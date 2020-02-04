import express from 'express'
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

let visonicCookie = ''
let visonicSessionId = ''
const sessionData = {
    curindex: 0,
    sesid: visonicSessionId,
    sesusername: visonicUser,
    sesusermanager: 99,
    serial: visonicSerial,
}
let db
const pingJitter = 120000 // 2 minutes

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
    timestamp: Date,
    logDates: {
        type: Map, // { date: value }
        of: {
            _id: false,
            logHrs: {
                type: Map, // { hour: value }
                of: {
                    _id: false,
                    logMins: { // { minute: value }
                        type: Map,
                        of: {
                            _id: false,
                            pinged: Boolean,
                        },
                    },
                },
            },
        },
    },
    created: Date, // timestamp without time
    first: Number,
    last: Number,
    sampleTime: {
        type: Map, // <time>
        of: {
            _id: false,
            srcId: {
                type: Map, // <panel|zone>
                of: {
                    _id: false,
                    pinged: Boolean,
                    status: String,
                },
            },
        },
    },
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
 * Initialize middleware
 **************************************************************************** */
appHttps.use(cors())
appHttps.use(express.static('Resources/Private/Powerlink/static'))
// appHttps.use(express.static('Resources/Private/Powerlink/dist'))
appHttps.use(express.static('Resources/Public/js'))
appHttps.use(express.static('Resources/Public/src'))
appHttps.use(express.static('node_modules'))
appHttps.use(bodyParser.json())
appHttps.use(bodyParser.xml())
appHttp.use(cors())
appHttp.use(bodyParser.json())
appHttp.use(bodyParser.xml())

/**
 * RESTful like API (HTTPS)
 **************************************************************************** */
appHttps.get('/api/allstats', (req, res) => {
     SystemLog.find()
         .then(docs => {
             const finalDoc = docs.reduce((tempDoc, doc) => {
                 tempDoc.last = doc.last
                 tempDoc.sampleCnt += doc.sampleCnt
                 tempDoc.sampleTime = new Map([...tempDoc.sampleTime, ...doc.sampleTime])
                 return tempDoc
             })
             res.json(finalDoc)
         })
         .catch(err => {
             console.log(`Error:  ${err}`)
             res.status(500).json({ message: `Internal Server Error: ${err}` })
         })
})
appHttps.get('/api/pinglog', (req, res) => {
     SystemLog.find({})
         .then(docs => {
             let prevTime = 0
             let endTime = 0
             let prevState
             const pingLog = []
             docs.reduce((pingLog, doc) => {
                 doc.sampleTime.forEach(({ srcId }, time) => {
                     time = parseInt(time)
                     if (!prevTime) {
                     // First sample
                         prevTime = time
                         endTime = time
                         prevState = ((srcId.get('0') || {}).pinged) ? 1 : 0
                         pingLog.push({
                             x: prevTime,
                             y: prevState,
                         })
                     } else if ((srcId.get('0') || {}).pinged) {
                     // New ping detected
                         if (prevState) {
                         // Ping from previous state
                             if (time - prevTime > pingJitter) {
                             // Ping not found within jitter...need to log
                                 pingLog.push({
                                     x: prevTime + 60000,
                                     y: 0,
                                 })
                                 pingLog.push({
                                     x: time,
                                     y: 1,
                                 })
                                 prevState = 1
                             }
                             prevTime = time
                             endTime = time
                         } else {
                             pingLog.push({
                                 x: time,
                                 y: 1,
                             })
                             prevState = 1
                             prevTime = time
                             endTime = time
                         }
                     }
                 })
                 return pingLog
             }, pingLog)
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
appHttps.get('/api/pinglog', (req, res) => {
    SystemLog.findOne()
        .then(doc => {
            res.json(doc)
        })
        .catch(err => {
            console.log(`Error:  ${err}`)
            res.status(500).json({ message: `Internal Server Error: ${err}` })
        })
})
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
 * HTTP based RESTful API for handling requests from Powerlink module
 **************************************************************************** */

//
// General ping from Powerlink module
// ----------------------------------
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
        .then(results => {
            console.log('Powerlink Resful API (GET: /scripts/update.php*):  System config...', typeof results)
        })

    SystemLog.updateOne({
        serial: sessionData.serial,
        created: new Date(logDate.toLocaleDateString()),
        sampleCnt: { $lt: 10000 },
    },
    {
        $setOnInsert: {
            ...req.query,
        },
        $set: {
            [`sampleTime.${logDate.getTime()}.srcId.0.pinged`]: true,
        },
        $inc: { sampleCnt: 1 },
        $min: { first: logDate },
        $max: { last: logDate },
    },
    {
        upsert: true,
    })
        .then(results => {
            console.log('Powerlink Resful API (GET: /scripts/update.php*):  System logs...', typeof results)
        })

    res.send('status=0&ka_time=50&allow=0&\n')
})

//
// Catch all GET handler
// ---------------------
appHttp.get('/scripts/*', (req, res) => {
    console.log('Powerlink Resful API (GET: /scripts/*):  ', typeof req, typeof res)
})

//
// Notification alert from Powerlink module
// ----------------------------------
appHttp.post('/scripts/notify.php', (req, res) => {
    console.log('Visonic POST (/scripts/notify.php):  ', req.body.notify.index[0], req.body.notify)
    res.type('application/xml')
    res.send(`<response><index>${req.body.notify.index[0]}</index></response>`)
})

//
// Catch all POST handler
// ---------------------
appHttp.post('/scripts/*', (req, res) => {
    console.log('Powerlink Resful API (POST: /scripts/*):  ', typeof req, typeof res)
})

/**
 * Supporting functions to facilitate Visonic Powerlink polling
 **************************************************************************** */
async function ajaxGet(url, query = {}) {
    try {
        const res = await axios.get(url, { params: query })
        const { data } = res
        console.log(`ajaxGet (${url}):  `, data)
    } catch (err) {
        console.log(`ajaxGet (ERR${url}):  `, err)
    }
}

async function ajaxPost(url, data = null, config = {}) {
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

/**
 * Internal delay function that returns a promise
 * 
 * @param {number} ms - milliseconds
 * @return {promise} Promise object after ms time has passed
 */
function _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Internal polling function
 * 
 * @callback function to use during polling cycle
 * @param {number} [interval=5000] - polling interval
 * @param {number} [retries=Infinity] - number of retries for the callback function
 */
function _poll(cb, interval = 5000, retries = Infinity) {
    //console.log('_poll START')
    return Promise.resolve()
        .then(cb)
        .catch(function retry(err) {
            console.log(`_poll ERR (retry):  `, err)
            if (retries-- > 0) {
                return _delay(interval)
                    .then(cb)
                    .catch(retry)
            }
            throw err
        })
}

/**
 * Main polling function
 */
function pollVisonic() {
    //
    // List of regular expressions for parsing response from Powerlink
    // ---------------------------------------------------------------
    const reloginRegex = /\[RELOGIN\]/          // Must login again
    const noChangeRegex = /\[NOCNG\]/           // No change
    const sessionIdRegex = /PowerLink=([^;]*)/  // Session ID

    _poll(() => ajaxPost(cmdStatus, querystring.stringify(sessionData), { header: { 'content-type': 'application/x-www-form-urlencoded' } })
        .then((result) => {
            if (reloginRegex.test(result.data)) {
            // System is not logged on...
                throw new Error('Login Failed')
            } else {
            // Proceed to parse XML to JS object
                return parseStringPromise(result.data)
            }
        })
        .then(jsObj => {
            // Must exit if no Powerlink serial number
            if (!sessionData.serial) {
                console.log('Polling:  Powerlink serial number is missing...')
                return _delay(1000)
            }

            const sampleDate = new Date(new Date().setMilliseconds(0))
            const sampleTime = sampleDate.getTime()

            if (jsObj.reply.customStatus && noChangeRegex.test(jsObj.reply.customStatus[0])) {
            // No change message received ([NOCNG])
                SystemLog.updateOne({
                    serial: sessionData.serial,
                    created: new Date(sampleDate.toLocaleDateString()),
                    sampleCnt: { $lt: 10000 },
                },
                {
                    $set: {
                        [`sampleTime.${sampleDate.getTime()}.srcId.0.status`]: '[NOCNG]',
                    },
                    $inc: { sampleCnt: 1 },
                    $min: { first: sampleDate },
                    $max: { last: sampleDate },
                },
                {
                    upsert: true,
                })
                    .then(results => {
                        // console.log(`SystemLog.updateOne:  `, results)
                    })

                return _delay(1000)
            }

            // Track update index
            sessionData.curindex = jsObj.reply.index

            let setObj = {}
            let configObj = {}
            let tempCnt = 0
            if (jsObj.reply.configuration) {
                setObj = jsObj.reply.configuration[0].sensors.reduce((tempObj, sensor) => {
                    tempObj[`sampleTime.${sampleTime}.srcId.${sensor.index[0]}.status`] = (sensor.status ? sensor.status[0] : 'OK')
                    tempCnt++
                    return tempObj
                }, setObj)

                configObj = jsObj.reply.detectors[0].detector.reduce((tempObj, { zone, loc, type, isalarm, status }) => {
                    tempObj[`sensorId.${zone[0]}.loc`] = loc[0]
                    tempObj[`sensorId.${zone[0]}.type`] = type[0]
                    tempObj[`sensorId.${zone[0]}.isalarm`] = isalarm[0]
                    tempObj[`sensorId.${zone[0]}.status`] = status[0]
                    tempCnt += 4
                    return tempObj
                }, configObj)
                // console.log(`pollVisonic (configObj):  `, configObj)
            } else if (jsObj.reply.update) {
                setObj = jsObj.reply.update[0].sensors.reduce((tempObj, sensor) => {
                    tempObj[`sampleTime.${sampleTime}.srcId.${sensor.index[0]}.status`] = (sensor.status ? sensor.status[0] : 'OK')
                    tempCnt++
                    return tempObj
                }, setObj)
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
                    console.log(`pollVisonic (SystemConfig):  Successful...`, typeof results)
                })

            SystemLog.updateOne({
                serial: sessionData.serial,
                created: new Date(sampleDate.toLocaleDateString()),
                sampleCnt: { $lt: 10000 },
            },
            {
                $set: setObj,
                $inc: { sampleCnt: tempCnt },
                $min: { first: sampleDate },
                $max: { last: sampleDate },
            },
            {
                upsert: true,
            })
                .then(results => {
                    console.log(`pollVisonic (SystemLog):  Successful...`, typeof results)
                })

            return _delay(1000)
        })
        .then(pollVisonic)
        .catch(err => {
            console.log(`pollVisonic (catch::err):  ${err.message}`)
            switch (err.message) {
            case 'Login Failed':
                _poll(() => ajaxPost(
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
                        return _delay(5000)
                    })
                    .then(pollVisonic),
                5000)
                break
            default:
                pollVisonic()
                break
            }
        }),
    5000)
}

/**
 * Connect to mongodb and then start server
 **************************************************************************** */
mongoose.connect('mongodb://localhost/visonic', { useUnifiedTopology: true, useNewUrlParser: true }).then(dbClient => {
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
