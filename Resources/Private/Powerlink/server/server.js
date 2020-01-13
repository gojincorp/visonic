const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId
const fs = require('fs')
const Issue = require('./issues.js')

const hskey = fs.readFileSync('/Users/ibserveradmin/letsencrypt/config/live/visonic.ideasbeyond.com/privkey.pem')
const hscert = fs.readFileSync('/Users/ibserveradmin/letsencrypt/config/live/visonic.ideasbeyond.com/cert.pem')
const options = {
    key: hskey,
    cert: hscert,
}

/**
 * Initialize middleware
 ******************************************************************************/
const app = express()
app.use(cors())
app.use(express.static('Resources/Private/Powerlink/static'))
//app.use(express.static('Resources/Private/Powerlink/dist'))
app.use(express.static('Resources/Public/js'))
app.use(express.static('node_modules'))
app.use(bodyParser.json())

/**
 * Setup Hot Module Replacement
 ******************************************************************************/
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
 ******************************************************************************/
app.get('/api/issues', (req, res) => {
    db.collection('issues').find().toArray().then(issues => {
        const _metadata = { total_count: issues.length }
        res.json({ _metadata, records: issues })
    }).catch(error => {
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
        return res.status(422).json({message: `Invalid request:  ${err}`})
    }
    
    db.collection('issues').insertOne(newIssue).then(result =>
        db.collection('issues').find({ _id: result.insertedId }).limit(1).next()
    ).then(newIssue => {
        res.json(newIssue)
    }).catch(error => {
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
let db
MongoClient.connect('mongodb://localhost/issuetracker', { useUnifiedTopology: true }).then(client => {
    db = client.db()

    // Initialize web server 
    const https = require('https')
    const server = https.createServer(options, app)
    //const io = require('socket.io').listen(server)
    server.listen(8080, function() {
        console.log('Server started on port 8080...')
    })
}).catch(err => {
    console.log('ERROR', err)
})