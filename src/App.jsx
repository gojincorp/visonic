// Builtin/3rd Party Modules
// -----------------------------------------------------------------------------
import 'core-js/stable'                 // Replacement for deprecated @babel-polyfill
import 'regenerator-runtime/runtime'    // Replacement for deprecated @babel-polyfill
import $ from 'jquery'
import 'bootstrap'
// import 'bootstrap/dist/css/bootstrap.min.css'
import './scss/main.scss'
import React from 'react'
import { render } from 'react-dom'
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useRouteMatch,
    useParams,
} from 'react-router-dom'

// Custom Modules
//------------------------------------------------------------------------------
import HealthMonitor from './HealthMonitor'
/* eslint-disable-next-line */
import SensorQuickView from './SensorQuickView'
import D3timeline from './D3timeline'
import { Toggler } from './utils/hoc'

$(() => {
    const contentNode = $('#contents')[0]

    // Dummy page components
    const NoMatch = () => <p>Page Not Found...</p>
    function Topics() {
        const match = useRouteMatch()

        return (
            <div>
                <h2>Topics</h2>

                <ul>
                    <li>
                        <Link to={`${match.url}/components`}>Components</Link>
                    </li>
                    <li>
                        <Link to={`${match.url}/props-v-state`}>Props VS State</Link>
                    </li>
                </ul>

                <Switch>
                    <Route path={`${match.url}/:topicId`}>
                        <Topic />
                    </Route>
                    <Route path={match.url}>
                        <h3>Please select a topic...</h3>
                    </Route>
                </Switch>
            </div>
        )
    }

    function Topic() {
        const { topicId } = useParams()
        return (
            <h3>
                Requested Topic ID:  { topicId }
            </h3>
        )
    }
    
    const historicalDates = [
        {
            year: 1879,
            event: "Ski Manufacturing Begins",
        },
        {
            year: 1882,
            event: "US Ski Club Founded",
        },
        {
            year: 1926,
            event: "First US Ski Shop Opens",
        },
        {
            year: 1964,
            event: "Plastic Buckle Boots Available",
        },
    ]
    
    const D3Test = Toggler(D3timeline)

    const RoutingApp = () => (
        <Router>
            <div>
                <nav>
                    <ul>
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/sensorQuickView">Sensor Quick View</Link>
                        </li>
                        <li>
                            <Link to="/topics">Topics Test</Link>
                        </li>
                        <li>
                            <Link to="/d3timeline">D3 Timeline Test</Link>
                        </li>
                    </ul>
                </nav>
                <hr />
                <Switch>
                    <Route path="/d3timeline">
                        <D3Test name="History" data={historicalDates} />
                    </Route>
                    <Route exact path="/">
                        <HealthMonitor />
                    </Route>
                    <Route path="/sensorQuickView">
                        <SensorQuickView />
                    </Route>
                    <Route path="/topics">
                        <Topics />
                    </Route>
                    <Route path="*">
                        <NoMatch />
                    </Route>
                </Switch>
            </div>
        </Router>
    )

    render(<RoutingApp />, contentNode)
})

if (module.hot) {
    module.hot.accept()
}
