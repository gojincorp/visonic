import 'core-js/stable'                 // Replacement for deprecated @babel-polyfill
import 'regenerator-runtime/runtime'    // Replacement for deprecated @babel-polyfill
import $ from 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import React from 'react'
import ReactDOM from 'react-dom'
import HealthMonitor from './HealthMonitor' // Custom module

$(() => {
    const contentNode = $('#contents')[0]

    ReactDOM.render(<HealthMonitor />, contentNode)
})

if (module.hot) {
    module.hot.accept()
}
