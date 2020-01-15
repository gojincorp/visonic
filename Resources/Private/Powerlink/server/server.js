import express from 'express'
import https from 'https'
import SourceMapSupport from 'source-map-support' // Source Maps
import cors from 'cors'                 // Cross origin resource sharing
import bodyParser from 'body-parser'    // Handler for processing req.body
import { MongoClient } from 'mongodb'   // Database
// import { ObjectId } from 'mongodb'
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

/**
 * Initialize middleware
 **************************************************************************** */
const app = express()
app.use(cors())
app.use(express.static('Resources/Private/Powerlink/static'))
// app.use(express.static('Resources/Private/Powerlink/dist'))
app.use(express.static('Resources/Public/js'))
app.use(express.static('Resources/Public/src'))
app.use(express.static('node_modules'))
app.use(bodyParser.json())

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

// Make connection to mongodb
/*
MongoClient.connect('mongodb://localhost/issuetracker', { useUnifiedTopology: true }, function(err, client) {
    const db = client.db()
    db.collection('issues').find().toArray(function(err, issues) {
        console.log('Result of find:  ', issues)
        client.close()
    })
})
*/
MongoClient.connect('mongodb://localhost/issuetracker', { useUnifiedTopology: true }).then(client => {
    db = client.db()

    // Initialize web server
    const server = https.createServer(options, app)
    // const io = require('socket.io').listen(server)
    server.listen(8080, () => console.log('Server started on port 8080...'))
}).catch(err => {
    console.log('ERROR', err)
})
