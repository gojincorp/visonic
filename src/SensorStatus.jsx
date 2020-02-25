import React from 'react'
import PropTypes from 'prop-types'

export default function SensorChart({ chartId }) {
    return (
        <canvas id={chartId} width={800} height={400} style={{ width: '800px', height: '400px' }} />
    )
}

SensorChart.propTypes = {
    chartId: PropTypes.string,
}

SensorChart.defaultProps = {
    chartId: 'SensorChart',
}
