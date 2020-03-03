import * as d3 from 'd3'
import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { v4 } from 'uuid'

const Canvas = ({ children }) => (
    <svg height="200" width="600">
        { children }
    </svg>
)

Canvas.propTypes = {
    children: PropTypes.array,
}

Canvas.defaultProps = {
    children: [],
}

const TimelineDot = ({ position, txt }) => (
    <g transform={`translate(${position},0)`}>
        <circle cy={160} r={5} style={{ fill: 'blue' }} />
        <text y={115} x={-95} transform="rotate(-45)" style={{ fontSize: '10px' }}>{txt}</text>
    </g>
)

TimelineDot.propTypes = {
    position: PropTypes.number,
    txt: PropTypes.string,
}

TimelineDot.defaultProps = {
    position: 0,
    txt: '',
}

class D3timeline extends React.Component {
    constructor(props) {
        super(props)
        const times = d3.extent(props.data.map(d => d.year))
        const range = [50, 450]
        this.scale = d3.scaleTime().domain(times).range(range)
        this.state = { data: props.data }
    }

    render() {
        const { data } = this.state
        const { scale } = this
        const { name, state } = this.props

        console.log('D3 REDUX STORE:  ', state)
        return (
            <div className="timeline">
                <h1>{name} Timeline</h1>
                <Canvas>
                    {
                        data.map((d) => (
                            <TimelineDot key={`time_dot_${v4()}`} position={scale(d.year)} txt={`${d.year} - ${d.event}`} />
                        ))
                    }
                </Canvas>
            </div>
        )
    }
}

D3timeline.propTypes = {
    state: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    data: PropTypes.array,
}

D3timeline.defaultProps = {
    data: [],
}

const mapStateToProps = state => ({
    state,
})

const mapDispatchToProps = {
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(D3timeline)
