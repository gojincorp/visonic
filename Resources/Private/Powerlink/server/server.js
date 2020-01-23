import express from 'express'
import https from 'https'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'
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

/**
 * Initialize constants
 **************************************************************************** */
const appHttps = express() // External facing secure client web server
const appHttp = express() // Internal facing insecure Visonic proxy web server
const visonicIp = '192.168.2.200'
const visonicUser = 'ibvadmin'
const visonicPwd = 'blgn5w5ojk'
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
}
let db

/**
 * MongoDB Schemas
 **************************************************************************** */
const { Schema } = mongoose
/*
const sensorSchema = new Schema({
    zone: Number,
    loc: String,
    type: String,
    status: Boolean,
})
const Sensor = mongoose.model('Sensor', sensorSchema)
*/
const powerlinkSchema = new Schema({
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
})
const Powerlink = mongoose.model('Powerlink', powerlinkSchema)

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
appHttps.get('/api/pinglog', (req, res) => {
    Powerlink.findOne()
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
 * RESTful like API (HTTP)
 **************************************************************************** */

//
// General ping from Powerlink module
// ----------------------------------
appHttp.get('/scripts/update.php*', (req, res) => {
    const logDate = new Date()

    // Check for existing document
    Powerlink.findOne({ serial: req.query.serial })
        .then(doc => {
            if (doc) {
                const log = doc.logDates.get(logDate.toLocaleDateString())
                if (log === undefined) {
                    // log.logHrs.get(`${logDate.getHours()}`).logMins.set(`${logDate.getMinutes()}`, true)
                    doc.logDates.set(logDate.toLocaleDateString(), { logHrs: new Map([[`${logDate.getHours()}`, { logMins: new Map([[`${logDate.getMinutes()}`, { pinged: true }]]) }]]) })
                } else {
                    const logHr = log.logHrs.get(`${logDate.getHours()}`)
                    if (logHr === undefined) {
                        log.logHrs.set(`${logDate.getHours()}`, { logMins: new Map([[`${logDate.getMinutes()}`, { pinged: true }]]) })
                    } else {
                        logHr.set({ logMins: new Map([[`${logDate.getMinutes()}`, { pinged: true }]]) })
                    }
                }
                doc.save()
            } else {
                const newPowerlink = new Powerlink({
                    ...req.query,
                    timestamp: logDate,
                    // ping: new Map([[logDate.toLocaleDateString(), {time: new Map([[`${logDate.getHours()}`, new Map([[`${logDate.getMinutes()}`, true]])]])}]]),
                    logDates: new Map([[logDate.toLocaleDateString(), { logHrs: new Map([[`${logDate.getHours()}`, { logMins: new Map([[`${logDate.getMinutes()}`, { pinged: true }]]) }]]) }]]),
                })
                newPowerlink.save()
            }
        })
        .catch(err => console.log('Error:  ', err))

    res.send('status=0&ka_time=50&allow=0&\n')
})

appHttp.get('/scripts/*', (req, res) => {
    console.log('Visonic GET (/scripts/*):  ')
})

appHttp.post('/scripts/*', (req, res) => {
    console.log('Visonic POST (/scripts/*):  ', req.body)
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
 * @param {number} interval - polling interval
 * @param {number} [retries=Infinity] - number of retries for the callback function
 */
function _poll(cb, interval = 5000, retries = Infinity) {
    console.log('_poll START')
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

function _login(cb = null) {
    ajaxPost(cmdLogin, `user=${visonicUser}&pass=${visonicPwd}`, { 'content-type': 'application/x-www-form-urlencoded' })
        .then((result) => {
            console.log('Authenticated by Visonic...', result.headers['set-cookie'])
            if (cb) cb()
        })
}

function _checkStatus(cb = null) {
    ajaxGet(cmdStatus)
        .then((result) => {
            console.log('Authenticated by Visonic...', result.headers['set-cookie'])
            if (cb) cb()
        })
}

function pollVisonic() {
    //
    // List of regular expressions for parsing response from Powerlink
    // ---------------------------------------------------------------
    const reloginRegex = /\[RELOGIN\]/
    const sessionIdRegex = /PowerLink=([^;]*)/

        
    _poll(() => ajaxPost(cmdStatus, querystring.stringify(sessionData), { header: { 'content-type': 'application/x-www-form-urlencoded' } })
        .then((result) => {
            // Check if we need to relogin...
            if (reloginRegex.test(result.data)) {
                console.log('pollVisonic->throw(:  Login failed...')
                throw new Error('Login Failed')
            } else {
                console.log('pollVisonic (cmdStatus):  Successful...')
                return parseStringPromise(result.data)
            }
        })
        .then(jsonData => {
            console.log(`pollVisonic (parseStringPromise):  Successful...`, jsonData)
            // Track update index
            sessionData.curindex = jsonData.reply.index
            return _delay(5000)
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
                    .then((result) => {
                        console.log('Authenticated by Visonic...', result.headers['set-cookie'][0])
                        visonicCookie = result.headers['set-cookie'][0]
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

    // pollVisonic()
}).catch(err => {
    console.log('ERROR', err)
})
