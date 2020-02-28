import React from 'react'
import PropTypes from 'prop-types'

function Toggler (ComposedComponent) {
    return class Toggler extends React.Component {
        constructor(props) {
            super(props)
            const { hidden } = props
            this.state = { hidden }
            this.showHide = this.showHide.bind(this)
        }
        
        showHide() {
            const hidden = !this.state.hidden
            this.setState({hidden})
        }
        
        render() {
            const { hidden } = this.state
            return <div>
                <button onClick={this.showHide}>Toggle</button>
                {(!hidden) ?
                    <ComposedComponent {...this.props} {...this.state} /> :
                    ""
                }
            </div>
        }
    }
}

export {
    Toggler,
}
