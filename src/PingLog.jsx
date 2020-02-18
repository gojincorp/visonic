import React from 'react'
import moment from 'moment'

moment().format()

/**
 * Initialize constants
 **************************************************************************** */
const baseUrl = 'https://visonic.ideasbeyond.com:8430'

export default class PingLog extends React.Component {
    constructor() {
        super()
    }

    render() {
        const { chartId } = this.props
        return (
            <canvas id={chartId} width={800} height={400} style={{ width: '800px', height: '400px' }} />
        )
    }
}
