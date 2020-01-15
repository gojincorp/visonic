import 'core-js/stable'                 // Replacement for deprecated @babel-polyfill
import 'regenerator-runtime/runtime'    // Replacement for deprecated @babel-polyfill
import $ from 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import React from 'react'
import ReactDOM from 'react-dom'
import IssueList from './IssueList' // Custom module

$(() => {
    const contentNode = $('#contents')[0]

    ReactDOM.render(<IssueList />, contentNode)
})

if (module.hot) {
    module.hot.accept()
}
