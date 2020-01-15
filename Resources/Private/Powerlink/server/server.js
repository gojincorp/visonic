import express from 'express'
import https from 'https'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import SourceMapSupport from 'source-map-support' // Source Maps
import cors from 'cors'                 // Cross origin resource sharing
import bodyParser from 'body-parser'    // Handler for processing req.body
import bodyParserXml from 'body-parser-xml'
import { MongoClient, ObjectId } from 'mongodb'   // Database
import mongoose from 'mongoose'
import fs from 'fs'                     // File stream
import 'core-js/stable'                 // Replacement for @babel/polyfill
import 'regenerator-runtime/runtime'    // Replacement for @babel/polyfill
import Issue from './issues'         // Custom module

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

let db
const app = express()

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
    app.use(webpackDevMiddleware(bundler, { noInfo: true }))
    app.use(webpackHotMiddleware(bundler, { log: console.log }))
}

/**
 * Initialize middleware
 **************************************************************************** */
app.use(cors())
app.use(express.static('Resources/Private/Powerlink/static'))
// app.use(express.static('Resources/Private/Powerlink/dist'))
app.use(express.static('Resources/Public/js'))
app.use(express.static('Resources/Public/src'))
app.use(express.static('node_modules'))
app.use(bodyParser.json())

/**
 * RESTful like API
 **************************************************************************** */
app.get('/api/issues', (req, res) => {
    db.collection('issues').find().toArray()
        .then(issues => {
            const _metadata = { total_count: issues.length }
            res.json({ _metadata, records: issues })
        })
        .catch(error => {
            console.log(error)
            res.status(500).json({ message: `Internal Server Error: ${error}` })
        })
})
app.post('/api/issues', (req, res) => {
    const newIssue = req.body
    newIssue.created = new Date()
    if (!newIssue.status) newIssue.status = 'New'

    const err = Issue.validateIssue(newIssue)
    if (err) {
        return res.status(422).json({ message: `Invalid request:  ${err}` })
    }

    db.collection('issues').insertOne(newIssue)
        .then(result => db.collection('issues').find({ _id: result.insertedId }).limit(1).next())
        .then(returnIssue => {
            res.json(returnIssue)
        })
        .catch(error => {
            console.log(error)
            res.status(500).json({ message: `Internal Server Error: ${error}` })
        })
})



/**
 * Supporting functions to facilitate Visonic Powerlink polling
 **************************************************************************** */
async function ajaxGet(url, query = {}) {
    try {
        console.log(`ajaxGet (${url}):  `, data, res.headers)
        const res = await axios.get(url, { params: query })
        const data = res.data
    } catch (err) {
        console.log(`ajaxGet (ERR${url}):  `, err)
    }
}

async function ajaxPost(url, data = null, config = {}) {
    try {
        console.log(`ajaxPost (${url}):  `)
        const res = await axios.post(url, data, { ...config, withCredentials: true, ...((visonicCookie ? { headers: { Cookie: visonicCookie } } : null)) })
        //const data = res.data
        return res
    } catch (err) {
        console.log(`ajaxPost (ERR/${url}):  `, err.message)
        //res.status(500).json({ message: `Internal Server Error:  ${err}` })
        throw err
    }
}

function _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function _poll(fn, interval = 5000, retries = Infinity) {
    console.log('_poll START')
    return Promise.resolve()
        .then(fn)
        .catch(function retry(err) {
            console.log(`_poll ERR (retry):  `, err)
            if (retries-- > 0)
                return _delay(interval)
                    .then(fn)
                    .catch(retry)
            throw err
        })
}

function _login(cb = null) {
    ajaxPost(cmdLogin, `user=${visonicUser}&pass=${visonicPwd}`, { 'content-type': 'application/x-www-form-urlencoded' })
        .then ((result) => {
            console.log("Authenticated by Visonic...", result.headers['set-cookie'])
            if (cb) cb()
        })
}

function _checkStatus(cb = null) {
    ajaxGet(cmdStatus)
        .then ((result) => {
            console.log("Authenticated by Visonic...", result.headers['set-cookie'])
            if (cb) cb()
        })
}

function pollVisonic() {
    const relogin = /\[RELOGIN\]/
    const sessionIdMatchStr = /PowerLink=([^;]*)/
    _poll(() =>
        ajaxPost(cmdStatus, querystring.stringify(sessionData), { header: { 'content-type': 'application/x-www-form-urlencoded' } })
        .then ((result) => {
            // Check if we need to relogin...
            if (relogin.test(result.data)) {
                console.log("pollVisonic->throw(:  Login failed...")
                throw new Error('Login Failed')
            }
            else {
                console.log("pollVisonic (cmdStatus):  Successful...")
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
            switch(err.message) {
            case 'Login Failed':
                _poll(() =>
                    ajaxPost(cmdLogin,`user=${visonicUser}&pass=${visonicPwd}`,{ header: { 'content-type': 'application/x-www-form-urlencoded' } })
                    .then ((result) => {
                        console.log("Authenticated by Visonic...", result.headers['set-cookie'][0])
                        visonicCookie = result.headers['set-cookie'][0]
                        visonicSessionId = visonicCookie.match(sessionIdMatchStr)[1]
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
MongoClient.connect('mongodb://localhost/issuetracker', { useUnifiedTopology: true }).then(client => {
    db = client.db()

    // Initialize web server
    const server = https.createServer(options, app)
    // const io = require('socket.io').listen(server)
    server.listen(8080, () => console.log('Server started on port 8080...'))
}).catch(err => {
    console.log('ERROR', err)
})
