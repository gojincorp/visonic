import React from 'react'
import PropTypes from 'prop-types'

export default function PingLog({ chartId }) {
    return (
        <canvas id={chartId} width={800} height={400} style={{ width: '800px', height: '400px' }} />
    )
}

PingLog.propTypes = {
    chartId: PropTypes.string,
}

PingLog.defaultProps = {
    chartId: 'pingChart',
}
