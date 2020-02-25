import React from 'react'
import loadable from '@loadable/component'

const Button = loadable(
    () => import(/* webpackChunkName: "bootstrap_button" */ 'react-bootstrap/Button'),
    { fallback: <div>Loading</div> })

export default function SensorQuickView() {
    return (
        <div>
            Sensor quick view...<Button className="testCss1 testCss2 testCss3" onClick={() => console.log('Foobar barfoo...')}>LoadingTest</Button>
        </div>
    )
}
