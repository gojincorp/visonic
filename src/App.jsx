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
                    </ul>
                </nav>
                <hr />
                <Switch>
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
