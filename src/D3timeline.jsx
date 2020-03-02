import * as d3 from 'd3'
import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

const Canvas = ({ children }) =>
    <svg height="200" width="600">
        { children }
    </svg>

const TimelineDot = ({ position, txt }) =>
    <g transform={`translate(${position},0)`}>
        <circle cy={160} r={5} style={{fill: 'blue'}} />
        <text y={115} x={-95} transform="rotate(-45)" style={{fontSize: '10px'}}>{txt}</text>
    </g>

class _D3timeline extends React.Component {
    constructor(props) {
        super(props)
        const times = d3.extent(props.data.map(d => d.year))
        const range = [50,450]
        this.scale = d3.scaleTime().domain(times).range(range)
        this.state = { data: props.data, times, range}
    }
    
    render() {
        const { data } = this.state
        const { scale } = this
        const { state } = this.props

        console.log("D3 REDUX STORE:  ", state)
        return (
            <div className="timeline">
                <h1>{this.props.name} Timeline</h1>
                <Canvas>
                    {
                        data.map((d, i) =>
                            <TimelineDot key={i} position={scale(d.year)} txt={`${d.year} - ${d.event}`}>
                            </TimelineDot>
                        )
                    }
                </Canvas>
            </div>
        )
    }
}

_D3timeline.propTypes = {
    data: PropTypes.array,
}

_D3timeline.defaultProps = {
    data: [],
}

const mapStateToProps = state => ({
    state
})

const mapDispatchToProps = {
}

export const D3timeline = connect(
    mapStateToProps,
    mapDispatchToProps,
)(_D3timeline)