import "core-js/stable"                 // Replacement for deprecated @babel-polyfill
import "regenerator-runtime/runtime"    // Replacement for deprecated @babel-polyfill
import $ from 'jquery'
import Popper from 'popper.js'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import React from 'react'
import ReactDOM from 'react-dom'
import IssueList from './IssueList.jsx' // Custom module

$(function() {
const contentNode = $('#contents')[0]

ReactDOM.render(<IssueList />, contentNode)
})

if (module.hot) {
    module.hot.accept()
}
